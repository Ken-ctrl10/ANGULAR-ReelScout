import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PosterPipe } from './poster.pipe';

// The fields a card needs. Works with TMDB movies and saved favorites.
export interface CardMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
}

/**
 * Poster card used on every page.
 * Extra content (e.g. a Remove button) can be projected into the card body:
 *   <app-movie-card [movie]="m"><button>Remove</button></app-movie-card>
 */
@Component({
  selector: 'app-movie-card',
  imports: [RouterLink, PosterPipe, DatePipe, DecimalPipe],
  template: `
    <article class="card">
      <a [routerLink]="['/movie', movie().id]" class="card-link" tabindex="-1" aria-hidden="true">
        @if (movie().poster_path | poster; as src) {
          <img [src]="src" alt="" loading="lazy" />
        } @else {
          <div class="no-poster">{{ movie().title }}</div>
        }
      </a>
      <div class="card-body">
        <h3><a [routerLink]="['/movie', movie().id]">{{ movie().title }}</a></h3>
        @if (movie().release_date !== undefined || movie().vote_average !== undefined) {
          <p class="meta">
            <span>{{ movie().release_date ? (movie().release_date | date: 'yyyy') : '—' }}</span>
            @if (movie().vote_average) {
              <span class="rating" [attr.aria-label]="'Rated ' + (movie().vote_average | number: '1.1-1') + ' out of 10'">
                ★ {{ movie().vote_average | number: '1.1-1' }}
              </span>
            }
          </p>
        }
        <ng-content />
      </div>
    </article>
  `,
})
export class MovieCard {
  readonly movie = input.required<CardMovie>();
}
