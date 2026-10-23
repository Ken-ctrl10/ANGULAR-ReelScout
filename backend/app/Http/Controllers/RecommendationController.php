<?php

namespace App\Http\Controllers;

use App\Services\TmdbService;
use App\Support\TmdbError;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * "Because you liked..." row: TMDB recommendations based on the user's
 * most recent favorites, without movies they already saved.
 */
class RecommendationController extends Controller
{
    private const BASED_ON = 3;  // how many recent favorites to use

    private const LIMIT = 20;    // how many movies to return

    public function __construct(private TmdbService $tmdb) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $recent = $user->favorites()->latest()->take(self::BASED_ON)->get(['tmdb_id', 'title']);

        if ($recent->isEmpty()) {
            return response()->json(['based_on' => [], 'results' => []]);
        }

        $lists = [];
        foreach ($recent as $favorite) {
            try {
                $lists[] = $this->tmdb->recommendations($favorite->tmdb_id);
            } catch (RuntimeException $e) {
                // A missing or failing movie shouldn't break the whole row,
                // but a missing token or rate limit should be reported.
                if (in_array($e->getCode(), [401, 429, 500], true)) {
                    return TmdbError::response($e);
                }
            } catch (ConnectionException) {
                return TmdbError::unreachable();
            }
        }

        $saved = $user->favorites()->pluck('tmdb_id')->flip();

        return response()->json([
            'based_on' => $recent->map(fn ($f) => ['tmdb_id' => $f->tmdb_id, 'title' => $f->title])->values(),
            'results' => $this->mix($lists, $saved->all()),
        ]);
    }

    /**
     * Takes one movie from each list in turn (so every favorite is represented),
     * skipping duplicates and movies the user already saved.
     *
     * @param  array<int, array<int, array>>  $lists
     * @param  array<int, int>  $saved  tmdb_id => index (used as a set)
     */
    private function mix(array $lists, array $saved): array
    {
        $results = [];
        $seen = $saved;
        $longest = max(array_map('count', $lists) ?: [0]);

        for ($i = 0; $i < $longest && count($results) < self::LIMIT; $i++) {
            foreach ($lists as $list) {
                $movie = $list[$i] ?? null;
                if ($movie && ! isset($seen[$movie['id']])) {
                    $seen[$movie['id']] = true;
                    $results[] = $movie;
                    if (count($results) === self::LIMIT) {
                        break;
                    }
                }
            }
        }

        return $results;
    }
}
