import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { FavoritesService } from './core/favorites.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  host: {
    '(document:keydown.escape)': 'menuOpen.set(false)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class App {
  protected auth = inject(AuthService);
  protected favorites = inject(FavoritesService);
  private router = inject(Router);

  // Hamburger menu on phones and tablets.
  readonly menuOpen = signal(false);

  // Tapping outside the header closes the menu.
  onDocumentClick(event: Event): void {
    if (!(event.target as Element).closest('.site-header')) {
      this.menuOpen.set(false);
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      // Logged out locally either way (see AuthService.logout).
      complete: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
