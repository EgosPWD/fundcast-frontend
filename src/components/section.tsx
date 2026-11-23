import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionProps {
  title: string;
  /** Step or group marker shown before the title, e.g. "1". */
  index?: string;
  description?: string;
  children?: React.ReactNode;
}

/** Hairline-separated block with an uppercase label and a short explanation. */
export function Section({ title, index, description, children }: SectionProps) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: theme.border }]}>
      <View style={styles.header}>
        <ThemedText type="label" themeColor="textSecondary" accessibilityRole="header">
          {index ? `${index}. ${title}` : title}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 1, paddingTop: Spacing.three, gap: Spacing.three },
  header: { gap: Spacing.one },
  description: { fontWeight: 400 },
});
