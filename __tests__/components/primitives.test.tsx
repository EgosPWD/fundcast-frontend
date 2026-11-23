import { fireEvent, render, screen } from '@testing-library/react-native';

import { Amount } from '@/components/amount';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { StatTile } from '@/components/stat-tile';

describe('Amount', () => {
  it('formats compact and full USD amounts', async () => {
    await render(
      <>
        <Amount value={2957178.72} format="compact" />
        <Amount value={2957178.72} />
      </>,
    );
    expect(screen.getByText('US$ 2.96 M')).toBeTruthy();
    expect(screen.getByText('US$ 2,957,179')).toBeTruthy();
  });
});

describe('StatTile', () => {
  it('shows the threshold and a pass verdict', async () => {
    await render(<StatTile label="R²" value="0.615" target="Mínimo 0.55" met />);
    expect(screen.getByText('0.615')).toBeTruthy();
    expect(screen.getByText('Mínimo 0.55')).toBeTruthy();
    expect(screen.getByText('Cumple')).toBeTruthy();
  });

  it('shows a fail verdict', async () => {
    await render(<StatTile label="MAE_log" value="0.450" target="Máximo 0.40" met={false} />);
    expect(screen.getByText('No cumple')).toBeTruthy();
  });

  it('shows no verdict for a stat without threshold', async () => {
    await render(<StatTile label="RMSE_log" value="0.495" />);
    expect(screen.queryByText('Cumple')).toBeNull();
    expect(screen.queryByText('No cumple')).toBeNull();
  });
});

describe('Button', () => {
  it('ignores presses while busy', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" busy onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress when idle', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Notice', () => {
  it('announces errors and warnings but not success', async () => {
    await render(
      <>
        <Notice tone="error" message="Falló" />
        <Notice tone="success" message="Listo" />
      </>,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('Listo')).toBeTruthy();
  });
});
