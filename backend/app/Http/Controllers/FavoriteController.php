<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The logged-in user's favorite movies. Every query goes through
 * $request->user()->favorites(), so users only ever see their own.
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

        return response()->json($favorite, $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, int $tmdbId): Response
    {
        $request->user()->favorites()->where('tmdb_id', $tmdbId)->delete();

        return response()->noContent();
    }
}
