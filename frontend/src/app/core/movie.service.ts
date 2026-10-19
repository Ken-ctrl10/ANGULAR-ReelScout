import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from './api.config';
import { MovieDetails, MoviePage } from './movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);

  popular(page = 1): Observable<MoviePage> {
    return this.http.get<MoviePage>(`${API_URL}/movies/popular`, {
      params: new HttpParams().set('page', page),
    });
  }

  search(query: string, page = 1): Observable<MoviePage> {
    return this.http.get<MoviePage>(`${API_URL}/movies/search`, {
      params: new HttpParams().set('q', query).set('page', page),
    });
  }

  details(id: number): Observable<MovieDetails> {
    return this.http.get<MovieDetails>(`${API_URL}/movies/${id}`);
  }
}
