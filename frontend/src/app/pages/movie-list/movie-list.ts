import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { DiscoverFilters, DiscoverSort, MoviePage } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { MovieCard } from '../../shared/movie-card';

const SORTS: { value: DiscoverSort; label: string }[] = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'revenue.desc', label: 'Highest grossing' },
];

const DEFAULT_SORT: DiscoverSort = 'popularity.desc';

/**
 * Browse page (/browse): search by title, or filter by genre, year, rating and sort.
 * Everything is kept in the URL (?q=&genre=&year=&rating=&sort=&page=), so refresh,
 * Back and shared links keep the same results.
 */
@Component({
  selector: 'app-movie-list',
  imports: [MovieCard],
  templateUrl: './movie-list.html',
})
export class MovieList {
  private movies = inject(MovieService);
  private router = inject(Router);
  private params = inject(ActivatedRoute).snapshot.queryParamMap;

  readonly sorts = SORTS;
  readonly years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);
  readonly ratings = [9, 8, 7, 6, 5];
  readonly genres = toSignal(this.movies.genres().pipe(catchError(() => of([]))), { initialValue: [] });

  // Starting values come from the URL.
  readonly query = signal(this.params.get('q') ?? '');
  readonly genre = signal(toNumber(this.params.get('genre')));
  readonly year = signal(toNumber(this.params.get('year')));
  readonly minRating = signal(toNumber(this.params.get('rating')));
  readonly sort = signal<DiscoverSort>(toSort(this.params.get('sort')));
  readonly page = signal(toNumber(this.params.get('page')) ?? 1);
  private readonly reloadCount = signal(0);

  readonly result = signal<MoviePage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filters = computed<DiscoverFilters>(() => ({
    genre: this.genre(),
    year: this.year(),
    minRating: this.minRating(),
    sort: this.sort(),
  }));
  readonly hasFilters = computed(
    () => !!(this.genre() || this.year() || this.minRating() || this.sort() !== DEFAULT_SORT),
  );
  readonly isSearching = computed(() => this.query().trim().length > 0);
  readonly heading = computed(() => (this.isSearching() ? 'Search results' : 'Browse movies'));
  readonly lastPage = computed(() => Math.min(this.result()?.total_pages ?? 1, 500));

  // Wait until the user stops typing for 400ms before searching.
  private readonly debouncedQuery$ = toObservable(this.query).pipe(
    debounceTime(400),
    map((q) => q.trim()),
    distinctUntilChanged(),
  );
  private readonly filters$ = toObservable(this.filters).pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  );

  constructor() {
    // A new search or new filters start again at page 1 (skip the first value = page load).
    combineLatest([this.debouncedQuery$, this.filters$])
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.page.set(1));

    // Fetch whenever the search, filters, page or retry counter change.
    // switchMap cancels the previous request if a newer one starts.
    combineLatest([this.debouncedQuery$, this.filters$, toObservable(this.page), toObservable(this.reloadCount)])
      .pipe(
        tap(([q, filters, page]) => {
          this.loading.set(true);
          this.error.set(null);
          this.syncUrl(q, filters, page);
        }),
        switchMap(([q, filters, page]) =>
          (q ? this.movies.search(q, page) : this.movies.discover(filters, page)).pipe(
            catchError((err) => {
              this.error.set(errorMessage(err));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.result.set(res);
        this.loading.set(false);
      });
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onGenre(event: Event): void {
    this.genre.set(toNumber((event.target as HTMLSelectElement).value));
  }

  onYear(event: Event): void {
    this.year.set(toNumber((event.target as HTMLSelectElement).value));
  }

  onRating(event: Event): void {
    this.minRating.set(toNumber((event.target as HTMLSelectElement).value));
  }

  onSort(event: Event): void {
    this.sort.set(toSort((event.target as HTMLSelectElement).value));
  }

  clearFilters(): void {
    this.genre.set(null);
    this.year.set(null);
    this.minRating.set(null);
    this.sort.set(DEFAULT_SORT);
  }

  goToPage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    // Bumping the counter re-runs the fetch with the same search, filters and page.
    this.reloadCount.update((n) => n + 1);
  }

  private syncUrl(q: string, filters: DiscoverFilters, page: number): void {
    this.router.navigate([], {
      queryParams: {
        q: q || null,
        genre: filters.genre,
        year: filters.year,
        rating: filters.minRating,
        sort: filters.sort === DEFAULT_SORT ? null : filters.sort,
        page: page > 1 ? page : null,
      },
      replaceUrl: true, // don't add a Back-button entry for every change
    });
  }
}

function toNumber(value: string | null): number | null {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
}

function toSort(value: string | null): DiscoverSort {
  return SORTS.some((s) => s.value === value) ? (value as DiscoverSort) : DEFAULT_SORT;
}
