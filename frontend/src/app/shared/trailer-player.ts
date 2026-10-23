import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// YouTube video ids are short and only use letters, digits, - and _.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

/**
 * Embedded YouTube trailer. Loaded only when the user clicks "Play trailer"
 * (the detail page wraps it in @defer (on interaction)).
 */
@Component({
  selector: 'app-trailer-player',
  template: `
    @if (src(); as url) {
      <div class="trailer-frame">
        <iframe
          [src]="url"
          [title]="title() + ' trailer'"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    } @else {
      <p class="muted">This trailer can't be played.</p>
    }
  `,
})
export class TrailerPlayer {
  private sanitizer = inject(DomSanitizer);

  readonly videoKey = input.required<string>();
  readonly title = input('Movie');

  /**
   * Angular blocks iframe URLs from data by default (they could load anything).
   * We only mark the URL as safe after checking the id, and always use YouTube's
   * privacy-friendly domain.
   */
  readonly src = computed<SafeResourceUrl | null>(() => {
    const key = this.videoKey();
    if (!YOUTUBE_ID.test(key)) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`,
    );
  });
}
