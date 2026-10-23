import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from './api.config';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('reelscout.token', 'my-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  it('adds the Bearer token to calls to our API', () => {
    http.get(`${API_URL}/favorites`).subscribe();

    expect(backend.expectOne(`${API_URL}/favorites`).request.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('does not send the token to other websites', () => {
    http.get('https://example.com/data').subscribe();

    expect(backend.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('logs the user out when the API answers 401', () => {
    http.get(`${API_URL}/favorites`).subscribe({ error: () => {} });
    backend.expectOne(`${API_URL}/favorites`).flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(false);
  });
});
