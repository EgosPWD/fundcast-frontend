import { Button } from '@/components/button';

interface ActionButtonProps {
  label: string;
  busy: boolean;
  onPress: () => void;
}

/** Primary button that shows a spinner and ignores presses while its request runs. */
export function ActionButton({ label, busy, onPress }: ActionButtonProps) {
  return <Button label={label} busy={busy} onPress={onPress} />;
}
