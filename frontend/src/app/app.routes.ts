import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
