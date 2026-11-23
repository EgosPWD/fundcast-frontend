import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Field } from '@/components/field';
import { Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  helper?: string;
}

/** Labelled text input; the accessibility label is the plain label (no required marker). */
export function TextField({ label, required, helper, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <Field label={label} required={required} helper={helper}>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }, style]}
        {...rest}
      />
    </Field>
  );
}

export const inputStyle = {
  borderWidth: 1,
  borderRadius: Radius.sm,
  minHeight: TouchTarget,
  paddingHorizontal: Spacing.three,
  paddingVertical: Spacing.two,
  fontSize: 16,
} as const;

const styles = StyleSheet.create({ input: inputStyle });
