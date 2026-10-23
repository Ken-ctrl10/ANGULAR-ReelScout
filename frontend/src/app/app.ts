import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { FavoritesService } from './core/favorites.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(AuthService);
  protected favorites = inject(FavoritesService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      // Logged out locally either way (see AuthService.logout).
      complete: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
