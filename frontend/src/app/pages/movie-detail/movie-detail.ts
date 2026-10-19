import { Location } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { MovieDetails } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { PosterPipe } from '../../shared/poster.pipe';

@Component({
  selector: 'app-movie-detail',
  imports: [PosterPipe],
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

  runtime(minutes: number | null): string {
    if (!minutes) return '';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
