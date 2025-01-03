import type { EntityWithTimestamps } from '$lib/dal/dal-types';

export function withoutTimestamps<T extends EntityWithTimestamps>(
  record: T
): Omit<T, 'createdAt' | 'updatedAt'> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...dataFields } = record;
  return dataFields;
}
