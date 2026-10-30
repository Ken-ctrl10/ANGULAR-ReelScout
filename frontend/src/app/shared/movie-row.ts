import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../core/error-message';
import { Movie } from '../core/movie.model';
import { MovieCard } from './movie-card';

let nextId = 0;

/**
 * A titled, horizontally scrolling row of movie cards (home page).
 * The parent passes the request; the row subscribes, so nothing loads until the row
 * is actually rendered (e.g. inside @defer (on viewport)).
 *   <app-movie-row title="Trending" [source]="movies.list('trending')" />
 */
@Component({
  selector: 'app-movie-row',
  imports: [MovieCard],
  host: { '(window:resize)': 'updateArrows()' },
  template: `
    <section class="movie-row" [attr.aria-labelledby]="headingId">
      <div class="row-header">
        <h2 [id]="headingId">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="muted row-subtitle">{{ subtitle() }}</p>
        }
      </div>

      @if (error()) {
        <div class="row-state">
          <p class="error-text">{{ error() }}</p>
          <button type="button" (click)="retry()">Try again</button>
        </div>
      } @else if (loading()) {
        <div class="row-track" aria-busy="true">
          @for (i of placeholders; track i) {
            <div class="card skeleton row-skeleton"></div>
          }
        </div>
      } @else if (movies().length === 0) {
        <p class="muted row-state">{{ emptyText() }}</p>
      } @else {
        <div class="row-carousel">
          @if (canScrollLeft()) {
            <button
              type="button"
              class="carousel-arrow left"
              (click)="scroll(-1)"
              [attr.aria-label]="'Scroll ' + title() + ' left'"
            ></button>
          }
          <div class="row-track" #track (scroll)="updateArrows()">
            @for (movie of movies(); track movie.id) {
              <app-movie-card [movie]="movie" />
            }
          </div>
          @if (canScrollRight()) {
            <button
              type="button"
              class="carousel-arrow right"
              (click)="scroll(1)"
              [attr.aria-label]="'Scroll ' + title() + ' right'"
            ></button>
          }
        </div>
      }
    </section>
  `,
})
export class MovieRow {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly emptyText = input('No movies to show right now.');
  readonly source = input.required<Observable<{ results: Movie[] }>>();

  readonly headingId = `movie-row-${nextId++}`;
  readonly placeholders = [1, 2, 3, 4, 5, 6];

  readonly movies = signal<Movie[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly reloadCount = signal(0);

  // Arrows only show when there is more to scroll in that direction.
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  constructor() {
    combineLatest([toObservable(this.source), toObservable(this.reloadCount)])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([source]) =>
          source.pipe(
            map((page) => page.results),
            catchError((err) => {
              this.error.set(errorMessage(err));
              return of([] as Movie[]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((movies) => {
        this.movies.set(movies);
        this.loading.set(false);
        // Wait for the cards to be drawn before measuring the track.
        setTimeout(() => this.updateArrows());
      });
  }

  scroll(direction: 1 | -1): void {
    const el = this.track()?.nativeElement;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  updateArrows(): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 4);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  retry(): void {
    this.reloadCount.update((n) => n + 1);
  }
}
