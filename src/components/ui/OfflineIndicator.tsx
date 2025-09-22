import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOffline } from '../../contexts/OfflineContext';

export const OfflineIndicator = () => {
  const { isOnline, pendingSyncCount, getOfflineStatusMessage, offlineManager } = useOffline();

  if (isOnline && pendingSyncCount === 0) {
    return null; // Don't show indicator when fully online and synced
  }

  const backgroundColor = isOnline ? '#FFA500' : '#FF6B6B'; // Orange for syncing, red for offline
  const textColor = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}> 
      {isOnline && pendingSyncCount > 0 ? (
        <>
          <ActivityIndicator size="small" color={textColor} style={styles.spinner} />
          <Text style={[styles.text, { color: textColor }]}>{getOfflineStatusMessage()}</Text>
          <TouchableOpacity
            onPress={() => offlineManager.syncPendingData?.()}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{getOfflineStatusMessage()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  spinner: {
    marginRight: 6,
  },
  retryBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  }
});