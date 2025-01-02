export function errorifyAnyError(error: unknown): Error {
  if (error instanceof Error) {
    //   return JSON.stringify({ name: error.name, message: error.message, stack: error.stack});
    return error;
  } else if (typeof error === 'object' && error !== null) {
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error(`[Unstringifiable Object]: ${Object.prototype.toString.call(error)}`);
    }
  } else {
    return new Error(String(error));
  }
}

export function stringifyAnyError(error: unknown): string {
  if (error instanceof Error) {
    //   return JSON.stringify({ name: error.name, message: error.message, stack: error.stack});
    return error.message;
  } else if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return `[Unstringifiable Object]: ${Object.prototype.toString.call(error)}`;
    }
  } else {
    return String(error);
  }
}
