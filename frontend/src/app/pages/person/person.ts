import { DatePipe, Location } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';

import { errorMessage } from '../../core/error-message';
import { Person as PersonDetails } from '../../core/movie.model';
import { MovieService } from '../../core/movie.service';
import { CardMovie, MovieCard } from '../../shared/movie-card';
import { MovieRow } from '../../shared/movie-row';
import { PosterPipe } from '../../shared/poster.pipe';

/**
 * Actor page (/person/:id): profile, best-known movies and full filmography.
 */
@Component({
  selector: 'app-person',
  imports: [DatePipe, PosterPipe, MovieCard, MovieRow],
  templateUrl: './person.html',
})
export class Person {
  private movies = inject(MovieService);
  private location = inject(Location);

  // Filled from the :id route param (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  readonly person = signal<PersonDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showFullBio = signal(false);

  // MovieRow expects an Observable of { results }. Created once per person (not in the template).
  readonly knownFor$ = signal<Observable<{ results: CardMovie[] }> | null>(null);

  readonly age = computed(() => {
    const p = this.person();
    if (!p?.birthday) return null;
    const end = p.deathday ? new Date(p.deathday) : new Date();
    const birth = new Date(p.birthday);
    let years = end.getFullYear() - birth.getFullYear();
    const hadBirthday =
      end.getMonth() > birth.getMonth() || (end.getMonth() === birth.getMonth() && end.getDate() >= birth.getDate());
    return hadBirthday ? years : years - 1;
  });

  // Long biographies are cut to a few lines until "Read more" is clicked.
  readonly longBio = computed(() => (this.person()?.biography.length ?? 0) > 600);

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.showFullBio.set(false);
        }),
        switchMap((id) =>
          this.movies.person(Number(id)).pipe(
            catchError((err) => {
              this.error.set(errorMessage(err));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((person) => {
        this.person.set(person);
        this.knownFor$.set(person ? of({ results: person.known_for }) : null);
        this.loading.set(false);
        window.scrollTo({ top: 0 });
      });
  }

  back(): void {
    this.location.back();
  }
}
