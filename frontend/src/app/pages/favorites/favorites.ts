import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritesService } from '../../core/favorites.service';
import { PosterPipe } from '../../shared/poster.pipe';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, PosterPipe],
  templateUrl: './favorites.html',
})
export class Favorites {
  protected favorites = inject(FavoritesService);

  // tmdb_id of the movie currently being removed (to disable its button).
  readonly removingId = signal<number | null>(null);
  readonly removeError = signal<string | null>(null);

  remove(tmdbId: number): void {
    this.removingId.set(tmdbId);
    this.removeError.set(null);
    this.favorites.remove(tmdbId).subscribe({
      next: () => this.removingId.set(null),
      error: () => {
        this.removingId.set(null);
        this.removeError.set('Could not remove that movie. Please try again.');
      },
    });
  }
}
