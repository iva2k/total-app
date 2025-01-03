export function getNestedPropertyUntyped(
  obj: any,
  propertyPath: string[] | string,
  defaultValue: any
): any {
  if (typeof propertyPath === 'string') propertyPath = [propertyPath];
  return propertyPath.reduce((acc, key) => {
    if (acc && key in acc) {
      return acc[key];
    } else {
      return defaultValue;
    }
  }, obj);
}

export function getNestedProperty<T>(
  obj: any,
  propertyPath: string[] | string,
  defaultValue: T
): T {
  if (typeof propertyPath === 'string') propertyPath = [propertyPath];

  return propertyPath.reduce((acc, key) => {
    if (acc && key in acc) {
      return acc[key];
    } else {
      return defaultValue;
    }
  }, obj) as T;
}

export function ensureString(val: unknown, entry: string, allowEmpty = false): string {
  if (typeof val !== 'string') {
    throw new Error(`Expected string in ${entry}, got ${typeof val}`);
  }
  if (!allowEmpty && !val) {
    throw new Error(`Expected non-empty string in ${entry}, got empty string`);
  }
  return val;
}
