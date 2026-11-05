import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_URL } from '../../core/api.config';
import { MovieDetail } from './movie-detail';

const movie = {
  id: 1,
  title: 'Test',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2026-01-01',
  vote_average: 7,
  runtime: 100,
  tagline: '',
  genres: [],
  status: 'Released',
  original_language: 'en',
  budget: 44000000,
  revenue: 0,
  homepage: 'https://example.com/movie',
  imdb_id: 'tt1375666',
  production_companies: [
    { id: 1, name: 'Has Logo', logo_path: '/logo.png' },
    { id: 2, name: 'No Logo Films', logo_path: null },
  ],
  release_dates: {
    results: [
      { iso_3166_1: 'PH', release_dates: [{ certification: '' }] },
      { iso_3166_1: 'US', release_dates: [{ certification: '' }, { certification: 'PG-13' }] },
    ],
  },
  credits: {
    cast: [],
    crew: [
      { id: 2, name: 'Writer One', job: 'Story' },
      { id: 2, name: 'Writer One', job: 'Screenplay' },
      { id: 3, name: 'The Director', job: 'Director' },
      { id: 4, name: 'Camera Person', job: 'Director of Photography' },
    ],
  },
};

describe('MovieDetail crew and details', () => {
  async function render(data: object = movie) {
    TestBed.configureTestingModule({
      imports: [MovieDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    await TestBed.compileComponents(); // needed because the template uses @defer
    const fixture = TestBed.createComponent(MovieDetail);
    fixture.componentRef.setInput('id', '1');
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne(`${API_URL}/movies/1`).flush(data);
    await fixture.whenStable();
    return fixture;
  }

  it('shows key crew once per person, director first', async () => {
    const fixture = await render();

    expect(fixture.componentInstance.keyCrew()).toEqual([
      { id: 3, name: 'The Director', jobs: ['Director'] },
      { id: 2, name: 'Writer One', jobs: ['Screenplay', 'Story'] },
    ]);
  });

  it('uses the US age rating when there is no Philippines rating', async () => {
    const fixture = await render();

    expect(fixture.componentInstance.ageRating()).toBe('PG-13 (US)');
  });

  it('prefers the Philippines age rating', async () => {
    const results = [
      { iso_3166_1: 'US', release_dates: [{ certification: 'R' }] },
      { iso_3166_1: 'PH', release_dates: [{ certification: 'R-16' }] },
    ];
    const fixture = await render({ ...movie, release_dates: { results } });

    expect(fixture.componentInstance.ageRating()).toBe('R-16 (PH)');
  });

  it('shows company logos, names and links', async () => {
    const el = (await render()).nativeElement as HTMLElement;

    expect(el.querySelector('.companies img')?.getAttribute('alt')).toBe('Has Logo');
    expect(el.querySelector('.companies')?.textContent).toContain('No Logo Films');
    const links = [...el.querySelectorAll('.movie-links a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['https://example.com/movie', 'https://www.imdb.com/title/tt1375666/']);
  });

  it('hides the links section when there are no links', async () => {
    const el = (await render({ ...movie, homepage: '', imdb_id: null })).nativeElement as HTMLElement;

    expect(el.querySelector('.movie-links')).toBeNull();
  });

  it('shows status, language, budget and unknown revenue', async () => {
    const text = (await render()).nativeElement.textContent;

    expect(text).toContain('Released');
    expect(text).toContain('English');
    expect(text).toContain('$44,000,000');
    expect(text).toContain('Not available');
  });
});
