export class StatusManager {
  private state = $state<'idle' | 'busy' | 'done' | 'error'>('idle');
  status = $state<string>('');
  error = $state<string>('');

  constructor() {
    this.reset();
  }

  get isBusy(): boolean {
    return this.state === 'busy';
  }

  get isError(): boolean {
    return this.state === 'error';
  }

  setBusy(statusMessage: string = 'Processing...') {
    this.state = 'busy';
    this.status = statusMessage;
    this.log(`Status: ${statusMessage}`);
  }

  setDone(statusMessage: string = 'Completed successfully.') {
    this.state = 'done';
    this.status = statusMessage;
    this.log(`Status: ${statusMessage}`);
  }

  setError(errorMessage: string, statusMessage: string = 'An error occurred.') {
    this.state = 'error';
    this.status = statusMessage;
    this.error = errorMessage;
    this.logError(`Error: ${errorMessage}`);
  }

  reset() {
    this.state = 'idle';
    this.status = '';
    this.error = '';
  }

  getStatus() {
    return {
      state: this.state,
      statusMessage: this.status,
      errorMessage: this.error
    };
  }

  log(message: string, ...optionalParams: unknown[]) {
    if (import.meta.env.MODE === 'development') {
      console.log(message, ...optionalParams);
    }
  }

  private logError(message: string, ...optionalParams: unknown[]) {
    if (import.meta.env.MODE === 'development') {
      console.error(message, ...optionalParams);
    }
  }
}
