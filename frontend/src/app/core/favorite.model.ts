export type WatchStatus = 'want_to_watch' | 'watched';

export interface Favorite {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  status: WatchStatus;
  rating: number | null; // the user's own 1-5 stars
  note: string | null;
  created_at: string;
}

// The movie fields needed to save a favorite (works with Movie and MovieDetails).
export interface FavoriteInput {
  id: number;
  title: string;
  poster_path: string | null;
}

// Watchlist fields that can be changed. Only the fields sent are updated.
export type FavoriteChanges = Partial<Pick<Favorite, 'status' | 'rating' | 'note'>>;
