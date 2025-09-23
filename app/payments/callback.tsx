import { colors } from '@/src/config/theme';
import { paymentService } from '@/src/services/paymentService';
import { logger } from '@/src/utils/logger';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams<{ status?: string; orderId?: string }>();

  useEffect(() => {
    (async () => {
      logger.navigation.deepLink('ailms://payments/callback', { ...params });
      await paymentService.refreshEntitlements();
      // Always return to home per requirement
      router.replace('/');
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator />
    </View>
  );
}
