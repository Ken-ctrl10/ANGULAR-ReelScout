<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A movie a user saved. We store only the TMDB id plus a little
 * display data, not TMDB's whole catalog. It also works as a watchlist
 * entry: a status, the user's own 1-5 rating, and a note.
 */
#[Fillable(['tmdb_id', 'title', 'poster_path', 'status', 'rating', 'note'])]
#[Hidden(['user_id'])]
class Favorite extends Model
{
    public const STATUSES = ['want_to_watch', 'watched'];

    protected $attributes = [
        'status' => 'want_to_watch',
    ];

    protected function casts(): array
    {
        return [
            'tmdb_id' => 'integer',
            'rating' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
