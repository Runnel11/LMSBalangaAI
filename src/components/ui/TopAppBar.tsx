import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/src/config/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TopAppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor = colors.background,
}) => {
  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="dark-content" />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <IconSymbol name="chevron.left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
});