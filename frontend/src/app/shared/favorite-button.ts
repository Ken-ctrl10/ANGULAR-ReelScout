import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { FavoriteInput } from '../core/favorite.model';
import { FavoritesService } from '../core/favorites.service';

/**
 * Add/remove a movie from favorites.
 * Usage: <app-favorite-button [movie]="movie" />
 */
@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      type="button"
      class="fav-button"
      [class.active]="isFavorite()"
      [disabled]="busy()"
      [attr.aria-pressed]="isFavorite()"
      (click)="toggle()"
    >
      <span aria-hidden="true">{{ isFavorite() ? '♥' : '♡' }}</span>
      {{ isFavorite() ? 'In favorites' : 'Add to favorites' }}
    </button>
    @if (error()) {
      <small class="field-error">{{ error() }}</small>
    }
  `,
})
export class FavoriteButton {
  private auth = inject(AuthService);
  private favorites = inject(FavoritesService);
  private router = inject(Router);

  readonly movie = input.required<FavoriteInput>();

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly isFavorite = computed(() => this.favorites.isFavorite(this.movie().id));

  toggle(): void {
    // Not logged in: go to login, then come back to this page.
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    // remove() returns Observable<void> and add() Observable<Favorite>; we only need "done or failed".
    const request: Observable<unknown> = this.isFavorite()
      ? this.favorites.remove(this.movie().id)
      : this.favorites.add(this.movie());

    request.subscribe({
      next: () => this.busy.set(false),
      error: () => {
        this.busy.set(false);
        this.error.set('Could not update favorites. Please try again.');
      },
    });
  }
}
