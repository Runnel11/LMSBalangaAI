// Payment service scaffolding for Maya Hosted Checkout via Bubble workflows
// - Creates checkout sessions via Bubble (/wf/create_maya_checkout)
// - Refreshes entitlements via Bubble (/wf/list_purchases_for_user)
// - Caches unlocked level IDs in AsyncStorage for offline access

import { networkService } from '@/src/services/networkService';
import { logger } from '@/src/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { bubbleApi } from './bubbleApi';

const STORAGE_KEY = 'UNLOCKED_LEVEL_IDS';
const RETURN_URL = 'ailms://payments/callback';
const CANCEL_URL = 'ailms://payments/callback?status=cancel';

async function getLocalUnlocked() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

async function setLocalUnlocked(ids) {
  try {
    const unique = Array.from(new Set((ids || []).map(String)));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {}
}

export const paymentService = {
  // Start Maya hosted checkout via Bubble workflow
  async startCheckout({ levelId, productId, amount, currency } = {}) {
    try {
      if (!networkService.isOnline) {
        throw new Error('You are offline. Connect to the internet to make a purchase.');
      }
      logger.payments.started(productId, amount, currency);
      const body = {
        level_id: String(levelId),
        product_id: String(productId),
        // Let backend decide price; amount/currency optional
        amount: amount ?? null,
        currency: currency ?? 'PHP',
        return_url: RETURN_URL,
        cancel_url: CANCEL_URL,
      };

      const res = await bubbleApi.request('/wf/create_maya_checkout', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }, { useUserToken: true });

      const text = await res.text();
      if (!res.ok) throw new Error(`Create checkout failed: ${res.status} ${text}`);
      const data = JSON.parse(text || '{}');
      const checkoutUrl = data?.response?.checkout_url || data?.checkout_url || data?.url;
      if (!checkoutUrl) throw new Error('Missing checkout_url from server');

      // Open as auth session so it auto-closes on deep link back to RETURN_URL
      await WebBrowser.openAuthSessionAsync(checkoutUrl, RETURN_URL);
      return { success: true };
    } catch (e) {
      logger.payments.error('start_checkout', String(e?.message || e));
      return { success: false, error: String(e?.message || e) };
    }
  },

  // Pull entitlements from Bubble and cache locally
  async refreshEntitlements() {
    try {
      const res = await bubbleApi.request('/wf/list_purchases_for_user', { method: 'GET' }, { useUserToken: true });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Failed to list purchases');
      const data = JSON.parse(text || '{}');

      // Flexible parsing: support either level_ids or purchases array
      const levelIds = data?.response?.level_ids
        || data?.level_ids
        || (Array.isArray(data?.response?.purchases) ? data.response.purchases
              .filter(p => (p.status || '').toLowerCase() === 'paid')
              .map(p => p.level_id || p.level || p.levelId)
            : []);

      const clean = (levelIds || []).filter(Boolean).map(String);
      await setLocalUnlocked(clean);
      logger.payments.success('refresh_entitlements', { count: clean.length });
      return clean;
    } catch (e) {
      logger.payments.error('refresh_entitlements', String(e?.message || e));
      return [];
    }
  },

  // Read cached entitlements (no network)
  async getCachedEntitlements() {
    const arr = await getLocalUnlocked();
    return arr.map(String);
  },

  // Convenience helper
  async isLevelUnlocked({ levelId, orderIndex }) {
    // Levels 1-2 are always free
    if (typeof orderIndex === 'number' && orderIndex <= 2) return true;
    const cached = await getLocalUnlocked();
    const key = String(levelId);
    return cached.map(String).includes(key);
  }
};

export default paymentService;
