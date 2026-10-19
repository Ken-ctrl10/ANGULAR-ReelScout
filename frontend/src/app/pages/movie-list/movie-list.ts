import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { MoviePage } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { PosterPipe } from '../../shared/poster.pipe';

@Component({
  selector: 'app-movie-list',
  imports: [RouterLink, PosterPipe],
  templateUrl: './movie-list.html',
})

export class MovieList {
  private movies = inject(MovieService);
  private router = inject(Router);

  // What the user typed. Starts from ?q= in the URL so Back/refresh keep the search.
  readonly query = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  readonly page = signal(1);
  private readonly reloadCount = signal(0);

  readonly result = signal<MoviePage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Wait until the user stops typing for 400ms before searching.
  private readonly debouncedQuery$ = toObservable(this.query).pipe(
    debounceTime(400),
    map((q) => q.trim()),
    distinctUntilChanged(),
  );

  constructor() {
    // New search text: go back to page 1 and keep the URL in sync.
    this.debouncedQuery$.pipe(takeUntilDestroyed()).subscribe((q) => {
      this.page.set(1);
      this.router.navigate([], { queryParams: { q: q || null }, replaceUrl: true });
    });

    // Fetch whenever the (debounced) query or the page changes.
    // switchMap cancels the previous request if a newer one starts.
    combineLatest([this.debouncedQuery$, toObservable(this.page), toObservable(this.reloadCount)])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([q, page]) =>
          (q ? this.movies.search(q, page) : this.movies.popular(page)).pipe(
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

  goToPage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    // Bumping the counter re-runs the fetch with the same query and page.
    this.reloadCount.update((n) => n + 1);
  }
}
