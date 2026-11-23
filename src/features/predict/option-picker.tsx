import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMPTY_ENTRY = '\u0000empty';
const FREE_TEXT_ENTRY = '\u0000free';

interface OptionPickerProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Lets the user keep what they typed when it is not in `options`. */
  allowFreeText?: boolean;
  /** Extra first entry that clears the value (maps to `''`, i.e. omitted/null). */
  emptyLabel?: string;
}

/** Most rows rendered at once: lists can hold thousands of entries (e.g. investors). */
export const MAX_VISIBLE_OPTIONS = 50;

/** Searchable list: the value is one of `options`, or free text when `allowFreeText` is set. */
export function OptionPicker({ label, value, options, onChange, disabled = false, allowFreeText = false, emptyLabel }: OptionPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options;
  const truncated = matches.length > MAX_VISIBLE_OPTIONS;
  const typed = query.trim();
  // An existing option typed in another case is offered as itself, never as free text.
  const known = typed && options.some((option) => option.toLowerCase() === typed.toLowerCase());
  const freeText = allowFreeText && typed && !known ? typed : null;
  const visible = [
    ...(emptyLabel ? [EMPTY_ENTRY] : []),
    ...(freeText ? [FREE_TEXT_ENTRY] : []),
    ...matches.slice(0, MAX_VISIBLE_OPTIONS),
  ];

  function close() {
    setOpen(false);
    setQuery('');
  }

  function choose(option: string) {
    onChange(option);
    close();
  }

  const border = { borderColor: theme.border, backgroundColor: theme.background };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={value ? `Valor actual: ${value}` : 'Sin elegir'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, border, disabled && styles.disabled]}>
        <ThemedText themeColor={value ? 'text' : 'textSecondary'} numberOfLines={1} style={styles.valueText}>
          {value || `Elegir ${label.toLowerCase()}`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" importantForAccessibility="no">
          ▾
        </ThemedText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <ThemedView style={styles.backdrop}>
          <ThemedView style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="label" themeColor="textSecondary">
              {label}
            </ThemedText>
            <TextInput
              accessibilityLabel={`Buscar: ${label}`}
              placeholder="Escribe para filtrar"
              placeholderTextColor={theme.textSecondary}
              autoCorrect={false}
              autoFocus
              value={query}
              onChangeText={setQuery}
              style={[styles.field, border, { color: theme.text }]}
            />
            <FlatList
              data={visible}
              keyExtractor={(option) => option}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              style={styles.list}
              ListEmptyComponent={<ThemedText themeColor="textSecondary">Sin resultados.</ThemedText>}
              ListFooterComponent={
                truncated ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Mostrando los primeros {MAX_VISIBLE_OPTIONS} de {matches.length}. Sigue escribiendo para acotar.
                  </ThemedText>
                ) : undefined
              }
              renderItem={({ item }) => {
                const text = item === EMPTY_ENTRY ? emptyLabel! : item === FREE_TEXT_ENTRY ? `Usar "${freeText}"` : item;
                const chosen = item === EMPTY_ENTRY ? '' : item === FREE_TEXT_ENTRY ? freeText! : item;
                const selected = item === EMPTY_ENTRY ? false : chosen === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={text}
                    accessibilityState={{ selected }}
                    onPress={() => choose(chosen)}
                    style={[styles.option, selected && { backgroundColor: theme.accentSoft }]}>
                    <ThemedText style={selected ? { color: theme.accent, fontWeight: '700' } : undefined}>{text}</ThemedText>
                  </Pressable>
                );
              }}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={close} style={styles.close}>
              <ThemedText type="link">Cerrar</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  valueText: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '80%', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  disabled: { opacity: 0.5 },
  list: { flexGrow: 0 },
  option: { minHeight: TouchTarget, justifyContent: 'center', paddingHorizontal: Spacing.three, borderRadius: Radius.sm },
  close: { alignSelf: 'flex-end', minHeight: TouchTarget, justifyContent: 'center', paddingHorizontal: Spacing.two },
});
