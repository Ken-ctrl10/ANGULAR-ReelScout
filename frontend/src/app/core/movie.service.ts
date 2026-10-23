import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { API_URL } from './api.config';
import {
  DiscoverFilters,
  Genre,
  MovieDetails,
  MovieListCategory,
  MoviePage,
  Recommendations,
} from './movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);

  // The genre list rarely changes: fetch it once and share it with every subscriber.
  private readonly genres$ = this.http.get<Genre[]>(`${API_URL}/genres`).pipe(shareReplay(1));

  popular(page = 1): Observable<MoviePage> {
    return this.list('popular', page);
  }

  list(category: MovieListCategory, page = 1): Observable<MoviePage> {
    return this.http.get<MoviePage>(`${API_URL}/movies/list/${category}`, {
      params: new HttpParams().set('page', page),
    });
  }

  search(query: string, page = 1): Observable<MoviePage> {
    return this.http.get<MoviePage>(`${API_URL}/movies/search`, {
      params: new HttpParams().set('q', query).set('page', page),
    });
  }

  discover(filters: DiscoverFilters, page = 1): Observable<MoviePage> {
    let params = new HttpParams().set('sort', filters.sort).set('page', page);
    if (filters.genre) params = params.set('genre', filters.genre);
    if (filters.year) params = params.set('year', filters.year);
    if (filters.minRating) params = params.set('min_rating', filters.minRating);

    return this.http.get<MoviePage>(`${API_URL}/movies/discover`, { params });
  }

  genres(): Observable<Genre[]> {
    return this.genres$;
  }

  details(id: number): Observable<MovieDetails> {
    return this.http.get<MovieDetails>(`${API_URL}/movies/${id}`);
  }

  // Logged-in only (the interceptor adds the token).
  recommendations(): Observable<Recommendations> {
    return this.http.get<Recommendations>(`${API_URL}/recommendations`);
  }
}
