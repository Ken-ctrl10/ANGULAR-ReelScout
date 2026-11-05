import { CurrencyPipe, DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { MovieDetails } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { FavoriteButton } from '../../shared/favorite-button';
import { PosterPipe } from '../../shared/poster.pipe';
import { TrailerPlayer } from '../../shared/trailer-player';

// Crew jobs worth showing, most important first.
const KEY_JOBS = ['Director', 'Screenplay', 'Writer', 'Story', 'Novel', 'Characters'];
const MAX_CREW = 6;

@Component({
  selector: 'app-movie-detail',
  imports: [RouterLink, PosterPipe, FavoriteButton, TrailerPlayer, CurrencyPipe, DatePipe, DecimalPipe],
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

  // Directors and writers, one entry per person: "Mike Flanagan: Screenplay, Story".
  readonly keyCrew = computed(() => {
    const people = new Map<number, { id: number; name: string; jobs: string[] }>();
    const crew = (this.movie()?.credits?.crew ?? [])
      .filter((c) => KEY_JOBS.includes(c.job))
      .sort((a, b) => KEY_JOBS.indexOf(a.job) - KEY_JOBS.indexOf(b.job));

    for (const { id, name, job } of crew) {
      const person = people.get(id) ?? { id, name, jobs: [] };
      if (!person.jobs.includes(job)) person.jobs.push(job);
      people.set(id, person);
    }
    return [...people.values()].slice(0, MAX_CREW);
  });

  // "en" -> "English"
  readonly language = computed(() => {
    const code = this.movie()?.original_language;
    if (!code) return null;
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
    } catch {
      return code;
    }
  });

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
