import { HttpErrorResponse } from '@angular/common/http';

// Turns an HTTP error into a short message we can show the user.
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Is the Laravel API running on port 8000?';
    }
    return err.error?.message ?? `Request failed (${err.status}).`;
  }
  return 'Something went wrong.';
}
