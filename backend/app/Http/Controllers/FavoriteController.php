<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * The logged-in user's favorites (also their watchlist). Every query goes
 * through $request->user()->favorites(), so users only ever see their own.
 */
class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->favorites()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tmdb_id' => ['required', 'integer', 'min:1'],
            'title' => ['required', 'string', 'max:255'],
            'poster_path' => ['nullable', 'string', 'max:255'],
        ]);

        // Adding the same movie twice returns the existing favorite instead of failing.
        $favorite = $request->user()->favorites()->firstOrCreate(
            ['tmdb_id' => $validated['tmdb_id']],
            ['title' => $validated['title'], 'poster_path' => $validated['poster_path'] ?? null],
        );

        return response()->json($favorite->fresh(), $favorite->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Watchlist fields: status, rating (1-5, or null to clear), note.
     * Only the fields sent are changed.
     */
    public function update(Request $request, int $tmdbId): JsonResponse
    {
        $favorite = $request->user()->favorites()->where('tmdb_id', $tmdbId)->first();

        if (! $favorite) {
            return response()->json(['message' => 'This movie is not in your list.'], 404);
        }

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(Favorite::STATUSES)],
            'rating' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $favorite->update($validated);

        return response()->json($favorite);
    }

    public function destroy(Request $request, int $tmdbId): Response
    {
        $request->user()->favorites()->where('tmdb_id', $tmdbId)->delete();

        return response()->noContent();
    }
}
