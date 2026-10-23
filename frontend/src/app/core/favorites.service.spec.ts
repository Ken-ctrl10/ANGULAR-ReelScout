import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from './api.config';
import { AuthService } from './auth.service';
import { Favorite } from './favorite.model';
import { FavoritesService } from './favorites.service';

const inception: Favorite = {
  id: 1,
  tmdb_id: 27205,
  title: 'Inception',
  poster_path: null,
  status: 'want_to_watch',
  rating: null,
  note: null,
  created_at: '2026-10-23T00:00:00Z',
};

describe('FavoritesService', () => {
  let http: HttpTestingController;

  function setup(loggedIn: boolean): FavoritesService {
    localStorage.clear();
    if (loggedIn) localStorage.setItem('reelscout.token', 'my-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(FavoritesService);
    TestBed.tick(); // run effects (the one that loads favorites on login)
    return service;
  }

  afterEach(() => http.verify());

  it('loads favorites automatically when logged in', () => {
    const service = setup(true);

    http.expectOne(`${API_URL}/favorites`).flush([inception]);

    expect(service.count()).toBe(1);
    expect(service.isFavorite(27205)).toBe(true);
    expect(service.isFavorite(1)).toBe(false);
  });

  it('does not call the API when logged out', () => {
    const service = setup(false);

    http.expectNone(`${API_URL}/favorites`);
    expect(service.count()).toBe(0);
  });

  it('clears favorites on logout', () => {
    const service = setup(true);
    http.expectOne(`${API_URL}/favorites`).flush([inception]);

    TestBed.inject(AuthService).clearSession();
    TestBed.tick();

    expect(service.count()).toBe(0);
  });

  it('add, update and remove keep the list in sync', () => {
    const service = setup(true);
    http.expectOne(`${API_URL}/favorites`).flush([]);

    service.add({ id: 27205, title: 'Inception', poster_path: null }).subscribe();
    const addReq = http.expectOne(`${API_URL}/favorites`);
    expect(addReq.request.body).toEqual({ tmdb_id: 27205, title: 'Inception', poster_path: null });
    addReq.flush(inception);
    expect(service.isFavorite(27205)).toBe(true);

    service.update(27205, { status: 'watched', rating: 4 }).subscribe();
    const patchReq = http.expectOne(`${API_URL}/favorites/27205`);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...inception, status: 'watched', rating: 4 });
    expect(service.favorites()[0].status).toBe('watched');

    service.remove(27205).subscribe();
    http.expectOne(`${API_URL}/favorites/27205`).flush(null, { status: 204, statusText: 'No Content' });
    expect(service.count()).toBe(0);
  });
});
