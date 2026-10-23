import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/movie-list/movie-list').then((m) => m.MovieList),
    title: 'Reel Scout',
  },
  {
    // Lazy-loaded: the detail page code is only downloaded when first visited.
    path: 'movie/:id',
    loadComponent: () => import('./pages/movie-detail/movie-detail').then((m) => m.MovieDetail),
    title: 'Movie details · Reel Scout',
  },
  {
    path: 'favorites',
    canActivate: [authGuard], // logged-in users only
    loadComponent: () => import('./pages/favorites/favorites').then((m) => m.Favorites),
    title: 'My favorites · Reel Scout',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Log in · Reel Scout',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    title: 'Create account · Reel Scout',
  },
  { path: '**', redirectTo: '' },
];
