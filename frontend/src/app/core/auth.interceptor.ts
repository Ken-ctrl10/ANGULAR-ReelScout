import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_URL } from './api.config';
import { AuthService } from './auth.service';

/**
 * Runs on every HttpClient request:
 * 1. Adds "Authorization: Bearer <token>" to calls to our Laravel API.
 * 2. If the API answers 401 (token expired or revoked), logs the user out locally.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApiCall = req.url.startsWith(API_URL);

  const request =
    token && isApiCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (isApiCall && err instanceof HttpErrorResponse && err.status === 401 && token) {
        auth.clearSession();
      }
      return throwError(() => err);
    }),
  );
};
