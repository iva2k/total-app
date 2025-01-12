import { toast } from '@zerodevx/svelte-toast';

const styles = {
  info: { classes: ['toast-info'] },
  success: { classes: ['toast-success'] },
  error: { classes: ['toast-error'] },
  warning: { classes: ['toast-warning'] }
};

/**
 * Show a toast message with a specific type
 * @param message - The message to display
 * @param type - The type of toast message (info, success, error, warning)
 * @returns The toast id
 */
export function showToast(message: string, type: keyof typeof styles | string = 'info'): number {
  const style = styles[type as keyof typeof styles] ?? styles['info'];
  return toast.push(message, {
    // initial: 0,
    ...style
  });
}
