import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export class NetworkService {
  constructor() {
    this.isOnline = true;
    this.connectionType = 'wifi';
    this.listeners = [];
    this.unsubscribe = null;
  }

  // Initialize network monitoring
  async initialize() {
    if (Platform.OS === 'web') {
      // Web implementation
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    } else {
      // React Native implementation
      this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange);

      // Get initial state
      const state = await NetInfo.fetch();
      this.handleNetworkChange(state);
    }
  }

  // Handle network state changes
  handleNetworkChange = (state) => {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected && state.isInternetReachable !== false;
    this.connectionType = state.type;

    // Notify listeners if status changed
    if (wasOnline !== this.isOnline) {
      console.log(`Network status changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'} (${this.connectionType})`);
      this.notifyListeners(this.isOnline, this.connectionType);
    }
  };

  // Web event handlers
  handleOnline = () => {
    const wasOnline = this.isOnline;
    this.isOnline = true;
    this.connectionType = 'wifi'; // Assume wifi for web

    if (!wasOnline) {
      console.log('Network status changed: ONLINE (web)');
      this.notifyListeners(true, 'wifi');
    }
  };

  handleOffline = () => {
    const wasOnline = this.isOnline;
    this.isOnline = false;
    this.connectionType = 'none';

    if (wasOnline) {
      console.log('Network status changed: OFFLINE (web)');
      this.notifyListeners(false, 'none');
    }
  };

  // Add listener for network changes
  addListener(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  notifyListeners(isOnline, connectionType) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline, connectionType);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  // Get current network status
  async getNetworkStatus() {
    if (Platform.OS === 'web') {
      return {
        isConnected: navigator.onLine,
        type: navigator.onLine ? 'wifi' : 'none'
      };
    } else {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected && state.isInternetReachable !== false,
        type: state.type
      };
    }
  }

  // Check if we have a reliable connection for downloading
  hasReliableConnection() {
    return this.isOnline && (
      this.connectionType === 'wifi' ||
      this.connectionType === 'ethernet' ||
      this.connectionType === 'other'
    );
  }

  // Check if we should use cellular data for syncing
  shouldSyncOnCellular() {
    // You can add user preference logic here
    return this.connectionType === 'cellular' && this.isOnline;
  }

  // Cleanup
  cleanup() {
    if (Platform.OS === 'web') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    } else if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
  }
}

// Default instance
export const networkService = new NetworkService();