import { HttpErrorResponse } from '@angular/common/http';

// Turns an HTTP error into a short message we can show the user.
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Is the Laravel API running on port 8000?';
    }
    if (err.status === 429) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return err.error?.message ?? `Request failed (${err.status}).`;
  }
  return 'Something went wrong.';
}

// Laravel validation errors (422) come as { errors: { field: ['message', ...] } }.
// Returns the first message for each field, e.g. { email: 'The email has already been taken.' }.
export function fieldErrors(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse && err.status === 422 && err.error?.errors) {
    const result: Record<string, string> = {};
    for (const [field, messages] of Object.entries(err.error.errors as Record<string, string[]>)) {
      result[field] = messages[0];
    }
    return result;
  }
  return {};
}
