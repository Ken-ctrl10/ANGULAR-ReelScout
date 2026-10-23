import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Favorite, FavoriteChanges, WatchStatus } from '../../core/favorite.model';
import { FavoritesService } from '../../core/favorites.service';
import { MovieCard } from '../../shared/movie-card';

type Tab = 'all' | WatchStatus;

/**
 * My List (/favorites): saved movies as a watchlist.
 * Each movie has a status (want to watch / watched), the user's own 1-5 rating and a note.
 */
@Component({
  selector: 'app-favorites',
  imports: [RouterLink, MovieCard],
  templateUrl: './favorites.html',
})
export class Favorites {
  protected favorites = inject(FavoritesService);

  readonly tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'want_to_watch', label: 'Want to watch' },
    { value: 'watched', label: 'Watched' },
  ];
  readonly stars = [1, 2, 3, 4, 5];

  readonly tab = signal<Tab>('all');
  readonly visible = computed(() => {
    const tab = this.tab();
    const list = this.favorites.favorites();
    return tab === 'all' ? list : list.filter((f) => f.status === tab);
  });
  readonly countFor = (tab: Tab) =>
    tab === 'all' ? this.favorites.count() : this.favorites.favorites().filter((f) => f.status === tab).length;

  // tmdb_id of the movie currently being saved or removed (to disable its controls).
  readonly busyId = signal<number | null>(null);
  readonly actionError = signal<string | null>(null);
  // Note drafts, so typing doesn't save on every key: tmdb_id -> text.
  readonly drafts = signal<Record<number, string>>({});
  readonly savedNoteId = signal<number | null>(null);

  setStatus(fav: Favorite, status: WatchStatus): void {
    if (fav.status !== status) {
      this.save(fav, { status });
    }
  }

  // Clicking the current rating again clears it.
  setRating(fav: Favorite, stars: number): void {
    this.save(fav, { rating: fav.rating === stars ? null : stars });
  }

  noteValue(fav: Favorite): string {
    return this.drafts()[fav.tmdb_id] ?? fav.note ?? '';
  }

  onNoteInput(fav: Favorite, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.drafts.update((d) => ({ ...d, [fav.tmdb_id]: value }));
  }

  noteChanged(fav: Favorite): boolean {
    const draft = this.drafts()[fav.tmdb_id];
    return draft !== undefined && draft.trim() !== (fav.note ?? '');
  }

  saveNote(fav: Favorite): void {
    const note = (this.drafts()[fav.tmdb_id] ?? '').trim();
    this.save(fav, { note: note || null }, () => {
      this.drafts.update(({ [fav.tmdb_id]: _, ...rest }) => rest);
      this.savedNoteId.set(fav.tmdb_id);
      setTimeout(() => this.savedNoteId.set(null), 2000);
    });
  }

  remove(fav: Favorite): void {
    this.busyId.set(fav.tmdb_id);
    this.actionError.set(null);
    this.favorites.remove(fav.tmdb_id).subscribe({
      next: () => this.busyId.set(null),
      error: () => {
        this.busyId.set(null);
        this.actionError.set(`Could not remove "${fav.title}". Please try again.`);
      },
    });
  }

  private save(fav: Favorite, changes: FavoriteChanges, done?: () => void): void {
    this.busyId.set(fav.tmdb_id);
    this.actionError.set(null);
    this.favorites.update(fav.tmdb_id, changes).subscribe({
      next: () => {
        this.busyId.set(null);
        done?.();
      },
      error: () => {
        this.busyId.set(null);
        this.actionError.set(`Could not update "${fav.title}". Please try again.`);
      },
    });
  }
}
