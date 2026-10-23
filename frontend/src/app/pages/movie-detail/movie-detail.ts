import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { MovieDetails } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { FavoriteButton } from '../../shared/favorite-button';
import { PosterPipe } from '../../shared/poster.pipe';
import { TrailerPlayer } from '../../shared/trailer-player';

@Component({
  selector: 'app-movie-detail',
  imports: [PosterPipe, FavoriteButton, TrailerPlayer, DatePipe, DecimalPipe],
  templateUrl: './movie-detail.html',
})
export class MovieDetail {
  private movies = inject(MovieService);
  private location = inject(Location);

  // Filled from the :id route param (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  readonly movie = signal<MovieDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly topCast = computed(() => this.movie()?.credits?.cast.slice(0, 8) ?? []);

  // Best YouTube video: an official trailer, then any trailer, then a teaser.
  readonly trailer = computed(() => {
    const videos = (this.movie()?.videos?.results ?? []).filter((v) => v.site === 'YouTube');
    return (
      videos.find((v) => v.type === 'Trailer' && v.official) ??
      videos.find((v) => v.type === 'Trailer') ??
      videos.find((v) => v.type === 'Teaser') ??
      null
    );
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((id) =>
          this.movies.details(Number(id)).pipe(
            catchError((err) => {
              this.error.set(errorMessage(err));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((movie) => {
        this.movie.set(movie);
        this.loading.set(false);
      });
  }

  back(): void {
    this.location.back();
  }

  // "Leonardo DiCaprio" -> "LD" (shown when an actor has no photo)
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  runtime(minutes: number | null): string {
    if (!minutes) return '';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
