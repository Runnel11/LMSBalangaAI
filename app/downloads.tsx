import { Button } from '@/src/components/ui/Button';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { colors, spacing, typography } from '@/src/config/theme';
import { useOffline } from '@/src/contexts/OfflineContext';
import { getLessonById } from '@/src/db/index';
import { logger } from '@/src/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// CommonJS manager for platform-specific implementations
// eslint-disable-next-line @typescript-eslint/no-var-requires
const downloadManager = require('@/src/services/downloadManager');

type OfflineLessonMeta = {
  lessonId: string | number;
  title: string;
  totalSizeBytes: number;
  updatedAt: string;
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${v} ${sizes[i]}`;
};

export default function DownloadsScreen() {
  const { isOnline } = useOffline();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OfflineLessonMeta[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);

  const load = useCallback(async () => {
    const stop = logger.startTimer('Load downloads');
    try {
      setError(null);
      setLoading(true);
      const list: OfflineLessonMeta[] = await downloadManager.getOfflineLessons();
      const total: number = await downloadManager.getTotalOfflineSize();
      setItems(list);
      setTotalBytes(total);
  logger.db.query('downloads', `${list.length} items, ${formatFileSize(total)}`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      logger.download.failed('load_downloads', String(e?.message ?? e));
    } finally {
      setLoading(false);
      stop();
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (lessonId: string | number, title: string) => {
    try {
      const lesson = await getLessonById(String(lessonId));
      if (!lesson) {
        Alert.alert('Not found', 'Lesson data not found locally.');
        return;
      }
      const res = await downloadManager.deleteLocalLesson(lesson);
      if (res?.success) {
        logger.download.completed(String(lessonId), 0);
        await load();
        Alert.alert('Removed', `${title} removed from this device.`);
      } else {
        Alert.alert('Delete failed', res?.error || 'Could not remove download.');
      }
    } catch (e: any) {
      logger.download.failed(String(lessonId), String(e?.message ?? e));
      Alert.alert('Error', 'An error occurred while removing the download.');
    }
  };

  const handleClearAll = async () => {
    try {
      const confirm = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Clear all downloads',
          'This will remove all downloaded lessons from this device.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Clear', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirm) return;

      const result = await downloadManager.clearAllDownloads();
      if (!result?.success) {
        // Fallback: delete items individually to ensure DB flags reset across platforms
        const list: OfflineLessonMeta[] = await downloadManager.getOfflineLessons();
        for (const it of list) {
          try {
            const lesson = await getLessonById(String(it.lessonId));
            if (lesson) await downloadManager.deleteLocalLesson(lesson);
          } catch {}
        }
      }
      await load();
      Alert.alert('Cleared', 'All downloads have been removed.');
    } catch (e: any) {
      logger.download.failed('clear_all', String(e?.message ?? e));
      Alert.alert('Error', 'Could not clear downloads.');
    }
  };

  const count = items.length;
  const total = formatFileSize(totalBytes);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="Downloads" showBackButton />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Offline storage</Text>
          <Text style={styles.summaryText}>
            {count} downloaded {count === 1 ? 'lesson' : 'lessons'} • {total}
          </Text>
          {!isOnline && (
            <Text style={styles.caption}>Offline mode: you can remove downloads but cannot fetch new ones.</Text>
          )}
          <Button
            title="Clear all downloads"
            onPress={handleClearAll}
            style={styles.clearButton as any}
            accessibilityLabel="Clear all downloaded lessons"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Downloaded lessons</Text>
          {loading && <Text style={styles.caption}>Loading...</Text>}
          {!loading && items.length === 0 && (
            <Text style={styles.caption}>No downloaded lessons.</Text>
          )}
          {!loading && items.map((it) => (
            <View key={String(it.lessonId)} style={styles.item}>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>{it.title}</Text>
                <Text style={styles.itemMeta}>{formatFileSize(it.totalSizeBytes)}</Text>
              </View>
              <Button
                title="Remove"
                onPress={() => handleDelete(it.lessonId, it.title)}
                accessibilityLabel={`Remove ${it.title} from device`}
                style={styles.removeBtn as any}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  content: ViewStyle;
  summary: ViewStyle;
  summaryTitle: TextStyle;
  summaryText: TextStyle;
  caption: TextStyle;
  clearButton: ViewStyle;
  list: ViewStyle;
  sectionTitle: TextStyle;
  item: ViewStyle;
  itemTextWrap: ViewStyle;
  itemTitle: TextStyle;
  itemMeta: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  removeBtn: ViewStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: { flex: 1 },
  summary: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    ...(typography.h3 as any),
    color: colors.textPrimary,
  },
  summaryText: {
    ...(typography.body1 as any),
    color: colors.textSecondary,
  },
  caption: {
    ...(typography.caption as any),
    color: colors.textSecondary,
  },
  clearButton: {
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...(typography.h3 as any),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextWrap: { flex: 1, paddingRight: spacing.md },
  itemTitle: {
    ...(typography.body1 as any),
    color: colors.textPrimary,
  },
  itemMeta: {
    ...(typography.caption as any),
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: spacing.lg,
  },
  errorText: {
    ...(typography.body1 as any),
    color: colors.error,
  },
  removeBtn: {
    alignSelf: 'center',
  },
});
