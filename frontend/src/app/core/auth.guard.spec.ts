import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/favorites' } as RouterStateSnapshot;

  function setup(loggedIn: boolean): void {
    localStorage.clear();
    if (loggedIn) localStorage.setItem('reelscout.token', 'my-token');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  }

  it('authGuard lets logged-in users in', () => {
    setup(true);
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('authGuard sends logged-out users to /login with a returnUrl', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state)) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/login?returnUrl=%2Ffavorites');
  });

  it('guestGuard sends logged-in users home', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => guestGuard(route, state)) as UrlTree;

    expect(result.toString()).toBe('/');
  });

  it('guestGuard lets logged-out users see login/register', () => {
    setup(false);
    expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).toBe(true);
  });
});
