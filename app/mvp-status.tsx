import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { mvpSections, type ItemStatus } from '@/src/config/mvpStatus';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function StatusPill({ status }: { status: ItemStatus }) {
  const map = {
    'todo': { bg: colors.border, fg: colors.textSecondary, label: 'TODO' },
    'in-progress': { bg: colors.warning, fg: colors.surface, label: 'IN PROGRESS' },
    'done': { bg: colors.success, fg: colors.surface, label: 'DONE' },
  } as const;
  const s = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export default function MvpStatusScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="MVP Status" />
      <ScrollView style={styles.content}>
        {mvpSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.priority} — {section.title}</Text>
            </View>
            <View style={styles.card}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <StatusPill status={item.status} />
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
