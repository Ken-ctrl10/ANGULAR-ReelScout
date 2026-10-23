import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, shareReplay } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { FavoritesService } from '../../core/favorites.service';
import { MovieService } from '../../core/movie.service';
import { MovieRow } from '../../shared/movie-row';
import { PosterPipe } from '../../shared/poster.pipe';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PosterPipe, MovieRow, DatePipe, DecimalPipe],
  templateUrl: './home.html',
})
export class Home {
  private movies = inject(MovieService);
  protected auth = inject(AuthService);
  protected favorites = inject(FavoritesService);

  // Each row's request is created ONCE here. (Creating it in the template would make
  // a new request on every change detection.) Nothing is sent until a row subscribes.
  // shareReplay: the hero and the Trending row share ONE request.
  readonly trending$ = this.movies.list('trending').pipe(shareReplay(1));
  readonly nowPlaying$ = this.movies.list('now-playing');
  readonly upcoming$ = this.movies.list('upcoming');
  readonly topRated$ = this.movies.list('top-rated');
  readonly recommendations$ = this.movies.recommendations();

  // Hero banner: the first trending movie that has a backdrop image.
  // toSignal subscribes now, so the hero loads right away.
  private readonly trendingForHero = toSignal(
    this.trending$.pipe(
      map((page) => page.results),
      catchError(() => of(null)),
    ),
  );
  readonly hero = computed(() => this.trendingForHero()?.find((m) => m.backdrop_path) ?? null);
  readonly heroLoading = computed(() => this.trendingForHero() === undefined);

  // "Because you liked Inception, Interstellar" (the user's latest favorites).
  readonly recommendationsSubtitle = computed(() => {
    const titles = this.favorites.favorites().slice(0, 3).map((f) => f.title);
    return titles.length ? `Because you liked ${titles.join(', ')}` : '';
  });
}
