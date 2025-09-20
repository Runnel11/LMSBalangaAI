import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../../contexts/OfflineContext';

export const OfflineIndicator = () => {
  const { isOnline, connectionType, pendingSyncCount, getOfflineStatusMessage } = useOffline();

  if (isOnline && pendingSyncCount === 0) {
    return null; // Don't show indicator when fully online and synced
  }

  const backgroundColor = isOnline ? '#FFA500' : '#FF6B6B'; // Orange for syncing, red for offline
  const textColor = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {getOfflineStatusMessage()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});