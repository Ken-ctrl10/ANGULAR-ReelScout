import { Pipe, PipeTransform } from '@angular/core';

import { TMDB_IMAGE_URL } from '../core/api.config';

// Usage: {{ movie.poster_path | poster:'w342' }}
@Pipe({ name: 'poster' })
export class PosterPipe implements PipeTransform {
  transform(path: string | null | undefined, size = 'w342'): string | null {
    return path ? `${TMDB_IMAGE_URL}/${size}${path}` : null;
  }
}
