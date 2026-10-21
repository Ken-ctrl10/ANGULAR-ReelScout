import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { API_URL } from './api.config';
import { AuthResponse, LoginData, RegisterData, User } from './auth.model';

const TOKEN_KEY = 'reelscout.token';
const USER_KEY = 'reelscout.user';

/**
 * Holds the login state for the whole app (one shared instance).
 * The token is saved in localStorage so a page refresh keeps you logged in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private readonly _token = signal<string | null>(readStorage(TOKEN_KEY));
  private readonly _user = signal<User | null>(parseUser(readStorage(USER_KEY)));

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  /**
   * Called once at app start (see app.config.ts). If we have a saved token,
   * check it's still valid, since it may have been revoked.
   * Not done in the constructor: the HTTP call goes through authInterceptor,
   * which injects AuthService, and that would be a circular dependency.
   */
  restoreSession(): void {
    if (this._token()) {
      this.http.get<User>(`${API_URL}/user`).subscribe({
        next: (user) => this.setSession(this._token()!, user),
        // The interceptor clears the session on 401; other errors (server down) keep it.
        error: () => {},
      });
    }
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/register`, data)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  login(data: LoginData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/login`, data)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  logout(): Observable<void> {
    // Clear locally even if the server call fails, so the user is always logged out.
    return this.http.post<void>(`${API_URL}/logout`, {}).pipe(finalize(() => this.clearSession()));
  }

  clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    removeStorage(TOKEN_KEY);
    removeStorage(USER_KEY);
  }

  private setSession(token: string, user: User): void {
    this._token.set(token);
    this._user.set(user);
    writeStorage(TOKEN_KEY, token);
    writeStorage(USER_KEY, JSON.stringify(user));
  }
}

// localStorage can throw (private mode, blocked storage), so wrap every access.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not saved; the user stays logged in until they refresh.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

function parseUser(json: string | null): User | null {
  try {
    return json ? (JSON.parse(json) as User) : null;
  } catch {
    return null;
  }
}
