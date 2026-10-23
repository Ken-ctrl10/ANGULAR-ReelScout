import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from './api.config';
import { AuthService } from './auth.service';

const user = { id: 1, name: 'Ken', email: 'ken@example.test' };

describe('AuthService', () => {
  let http: HttpTestingController;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify()); // fails if a test left a request unanswered

  it('starts logged out when nothing is saved', () => {
    const auth = setup();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('login saves the token and user (signals and localStorage)', () => {
    const auth = setup();

    auth.login({ email: user.email, password: 'secret' }).subscribe();
    http.expectOne(`${API_URL}/login`).flush({ user, token: 'abc' });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.user()?.name).toBe('Ken');
    expect(localStorage.getItem('reelscout.token')).toBe('abc');
  });

  it('restores a saved session after a refresh', () => {
    localStorage.setItem('reelscout.token', 'saved');
    localStorage.setItem('reelscout.user', JSON.stringify(user));

    const auth = setup();

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.user()?.email).toBe(user.email);
  });

  it('logout clears the session even if the server call fails', () => {
    localStorage.setItem('reelscout.token', 'saved');
    const auth = setup();

    auth.logout().subscribe({ error: () => {} });
    http.expectOne(`${API_URL}/logout`).flush('down', { status: 500, statusText: 'Server Error' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('reelscout.token')).toBeNull();
  });
});
