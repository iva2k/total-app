import type { IValidationService, Schema } from '$lib/dal/dal-types';
// import { z } from 'zod';

// Validation service
export class ValidationService implements IValidationService {
  constructor(private readonly schema: Schema) {}

  validate(entityName: string, data: any) {
    return this.schema[entityName].safeParse(data);
  }

  parse(entityName: string, data: any) {
    return this.schema[entityName].parse(data);
  }
}
