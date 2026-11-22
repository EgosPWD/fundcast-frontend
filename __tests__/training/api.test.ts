import { buildTrainingForm, MAX_UPLOAD_BYTES, validateCsvAsset } from '@/features/training/api';

it('appends the web File directly under the field "file"', () => {
  const file = new File(['a,b\n1,2\n'], 'batch_1.csv', { type: 'text/csv' });
  const form = buildTrainingForm({ name: 'batch_1.csv', uri: 'blob:x', lastModified: 0, file });

  const part = form.get('file');
  expect(part).toBeInstanceOf(File);
  expect((part as File).name).toBe('batch_1.csv');
});

it('accepts an uppercase .CSV extension, the exact size limit, and an unknown size', () => {
  expect(validateCsvAsset({ name: 'DATA.CSV', size: MAX_UPLOAD_BYTES })).toBeNull();
  expect(validateCsvAsset({ name: 'data.csv', size: undefined })).toBeNull();
});
