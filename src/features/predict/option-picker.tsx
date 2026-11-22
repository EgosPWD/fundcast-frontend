import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface OptionPickerProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

/** Closed, searchable list: the value is always one of `options`, never free text. */
export function OptionPicker({ label, value, options, onChange }: OptionPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options;

  function close() {
    setOpen(false);
    setQuery('');
  }

  function choose(option: string) {
    onChange(option);
    close();
  }

  const border = { borderColor: theme.backgroundSelected };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={value ? `Valor actual: ${value}` : 'Sin elegir'}
        onPress={() => setOpen(true)}
        style={[styles.field, border]}>
        <ThemedText themeColor={value ? 'text' : 'textSecondary'}>{value || `Elegir ${label.toLowerCase()}`}</ThemedText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <ThemedView style={styles.backdrop}>
          <ThemedView style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{label}</ThemedText>
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
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item}
                  accessibilityState={{ selected: item === value }}
                  onPress={() => choose(item)}
                  style={[styles.option, item === value && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText>{item}</ThemedText>
                </Pressable>
              )}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={close} style={styles.close}>
              <ThemedText type="linkPrimary">Cerrar</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '80%', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  list: { flexGrow: 0 },
  option: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.two },
  close: { alignSelf: 'flex-end' },
});
