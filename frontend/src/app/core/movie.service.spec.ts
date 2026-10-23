import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from './api.config';
import { MovieService } from './movie.service';

describe('MovieService', () => {
  let service: MovieService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MovieService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() calls the category endpoint with a page', () => {
    service.list('top-rated', 2).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/movies/list/top-rated`);
    expect(req.request.params.get('page')).toBe('2');
  });

  it('discover() only sends the filters that are set', () => {
    service.discover({ genre: 28, year: null, minRating: 7, sort: 'vote_average.desc' }).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/movies/discover`);
    expect(req.request.params.get('genre')).toBe('28');
    expect(req.request.params.get('min_rating')).toBe('7');
    expect(req.request.params.get('sort')).toBe('vote_average.desc');
    expect(req.request.params.has('year')).toBe(false);
  });

  it('genres() is fetched once and shared', () => {
    service.genres().subscribe();
    service.genres().subscribe();

    http.expectOne(`${API_URL}/genres`).flush([{ id: 28, name: 'Action' }]);
  });
});
