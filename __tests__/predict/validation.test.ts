import { emptyPredictForm, type PredictFormValues, validatePredictForm } from '@/features/predict/validation';

const minimal: PredictFormValues = {
  ...emptyPredictForm,
  year: '2025',
  founded_year: '2021',
  stage: 'Seed',
  sector: 'Fintech',
  country: 'United States',
};

function errorOf(values: PredictFormValues): string {
  const result = validatePredictForm(values);
  if (result.ok) throw new Error('expected a validation error');
  return result.error;
}

it('builds the body with only the required fields and omits empty optional ones', () => {
  const result = validatePredictForm({ ...minimal, city: '  ', lead_investor: '', prev_amount_usd: '' });
  expect(result).toEqual({
    ok: true,
    body: { year: 2025, founded_year: 2021, stage: 'Seed', sector: 'Fintech', country: 'United States' },
  });
});

it('parses every optional field to the contract types', () => {
  const result = validatePredictForm({
    ...minimal,
    city: ' New York ',
    investor_count: '3',
    lead_investor: 'Y Combinator',
    news_mentions: '2',
    news_source: 'TechCrunch',
    company_domain: 'acme.io',
    prev_rounds: '1',
    prev_amount_usd: '1500000',
  });
  expect(result).toEqual({
    ok: true,
    body: {
      year: 2025,
      founded_year: 2021,
      stage: 'Seed',
      sector: 'Fintech',
      country: 'United States',
      city: 'New York',
      investor_count: 3,
      lead_investor: 'Y Combinator',
      news_mentions: 2,
      news_source: 'TechCrunch',
      company_domain: 'acme.io',
      prev_rounds: 1,
      prev_amount_usd: 1500000,
    },
  });
});

it.each([
  ['year', 'Año de la ronda'],
  ['founded_year', 'Año de fundación'],
  ['stage', 'Etapa'],
  ['sector', 'Sector'],
  ['country', 'País'],
] as const)('rejects a missing required field: %s', (field, label) => {
  expect(errorOf({ ...minimal, [field]: '' })).toBe(`Completa el campo obligatorio: ${label}.`);
});

it('rejects a year that is not an integer', () => {
  expect(errorOf({ ...minimal, year: '2025.5' })).toBe('Año de la ronda debe ser un número entero.');
});

it('rejects a founding year after the round year', () => {
  expect(errorOf({ ...minimal, founded_year: '2026' })).toBe(
    'El año de fundación no puede ser posterior al año de la ronda.',
  );
});

it('rejects a negative count', () => {
  expect(errorOf({ ...minimal, investor_count: '-1' })).toBe('Número de inversores no puede ser negativo.');
});

it('rejects a count that is not an integer', () => {
  expect(errorOf({ ...minimal, prev_rounds: 'dos' })).toBe('Rondas anteriores debe ser un número entero.');
});

it.each(['0', '-5', 'abc'])('rejects a non-positive previous amount: %s', (amount) => {
  expect(errorOf({ ...minimal, prev_amount_usd: amount })).toBe(
    'El monto de la ronda anterior debe ser un número mayor que 0.',
  );
});
