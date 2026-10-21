<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A movie a user saved. We store only the TMDB id plus a little
 * display data, not TMDB's whole catalog.
 */
#[Fillable(['tmdb_id', 'title', 'poster_path'])]
#[Hidden(['user_id'])]
class Favorite extends Model
{
    protected function casts(): array
    {
        return [
            'tmdb_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
