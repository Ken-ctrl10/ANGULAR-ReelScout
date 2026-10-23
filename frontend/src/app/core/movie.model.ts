export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

export interface MoviePage {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  key: string; // YouTube video id
  name: string;
  site: string; // "YouTube", "Vimeo", ...
  type: string; // "Trailer", "Teaser", "Clip", ...
  official: boolean;
}

export interface MovieDetails extends Movie {
  runtime: number | null;
  tagline: string;
  genres: Genre[];
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
}

// Home page rows (must match the categories in the Laravel route).
export type MovieListCategory = 'trending' | 'now-playing' | 'upcoming' | 'top-rated' | 'popular';

// Browse page filters. Empty values mean "any".
export interface DiscoverFilters {
  genre: number | null;
  year: number | null;
  minRating: number | null;
  sort: DiscoverSort;
}

export type DiscoverSort =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc'
  | 'revenue.desc';

export interface Recommendations {
  based_on: { tmdb_id: number; title: string }[];
  results: Movie[];
}
