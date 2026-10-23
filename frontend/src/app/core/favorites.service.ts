import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { Favorite, FavoriteInput } from './favorite.model';

/**
 * The logged-in user's favorites, shared by the whole app.
 * Loads automatically on login and clears on logout.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly _favorites = signal<Favorite[]>([]);
  readonly favorites = this._favorites.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly count = computed(() => this._favorites().length);

  // A Set makes "is this movie a favorite?" a fast lookup.
  private readonly ids = computed(() => new Set(this._favorites().map((f) => f.tmdb_id)));

  constructor() {
    // Re-runs whenever the login state changes.
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      // untracked: only isLoggedIn should re-trigger this effect, not the signals load() touches.
      untracked(() => (loggedIn ? this.load() : this._favorites.set([])));
    });
  }

  isFavorite(tmdbId: number): boolean {
    return this.ids().has(tmdbId);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Favorite[]>(`${API_URL}/favorites`).subscribe({
      next: (list) => {
        this._favorites.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your favorites.');
        this.loading.set(false);
      },
    });
  }

  add(movie: FavoriteInput): Observable<Favorite> {
    const body = { tmdb_id: movie.id, title: movie.title, poster_path: movie.poster_path };
    return this.http.post<Favorite>(`${API_URL}/favorites`, body).pipe(
      // Add to the list unless the server says it was already there.
      tap((fav) => {
        if (!this.isFavorite(fav.tmdb_id)) {
          this._favorites.update((list) => [fav, ...list]);
        }
      }),
    );
  }

  remove(tmdbId: number): Observable<void> {
    return this.http
      .delete<void>(`${API_URL}/favorites/${tmdbId}`)
      .pipe(tap(() => this._favorites.update((list) => list.filter((f) => f.tmdb_id !== tmdbId))));
  }
}
