export interface Favorite {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  created_at: string;
}

// The movie fields needed to save a favorite (works with Movie and MovieDetails).
export interface FavoriteInput {
  id: number;
  title: string;
  poster_path: string | null;
}
