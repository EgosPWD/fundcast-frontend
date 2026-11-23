import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}

/** Visible label + optional helper text around any input control. */
export function Field({ label, required = false, helper, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {required ? `${label} *` : label}
      </ThemedText>
      {children}
      {helper ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  helper: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
});
