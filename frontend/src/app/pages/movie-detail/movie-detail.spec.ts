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
  async function render() {
    TestBed.configureTestingModule({
      imports: [MovieDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    await TestBed.compileComponents(); // needed because the template uses @defer
    const fixture = TestBed.createComponent(MovieDetail);
    fixture.componentRef.setInput('id', '1');
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne(`${API_URL}/movies/1`).flush(movie);
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

  it('shows status, language, budget and unknown revenue', async () => {
    const text = (await render()).nativeElement.textContent;

    expect(text).toContain('Released');
    expect(text).toContain('English');
    expect(text).toContain('$44,000,000');
    expect(text).toContain('Not available');
  });
});
