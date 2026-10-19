<?php

namespace App\Http\Controllers;

use App\Services\TmdbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MovieController extends Controller
{
    public function __construct(private TmdbService $tmdb) {}

    public function popular(Request $request): JsonResponse
    {
        $page = max(1, min(500, $request->integer('page', 1)));

        return $this->respond(fn () => $this->tmdb->popular($page));
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ]);

        return $this->respond(fn () => $this->tmdb->search($validated['q'], (int) ($validated['page'] ?? 1)));
    }

    public function show(int $id): JsonResponse
    {
        return $this->respond(fn () => $this->tmdb->details($id));
    }

    /**
     * Turns TMDB failures into clean JSON errors for the frontend.
     */
    private function respond(callable $callback): JsonResponse
    {
        try {
            return response()->json($callback());
        } catch (RuntimeException $e) {
            [$status, $message] = match ($e->getCode()) {
                404 => [404, 'Movie not found.'],
                429 => [429, 'Too many requests to TMDB. Please try again shortly.'],
                401 => [502, 'TMDB rejected the API token. Check TMDB_TOKEN in .env.'],
                500 => [500, $e->getMessage()],
                default => [502, 'Could not reach TMDB. Please try again.'],
            };

            return response()->json(['message' => $message], $status);
        } catch (\Illuminate\Http\Client\ConnectionException) {
            return response()->json(['message' => 'Could not reach TMDB. Please try again.'], 502);
        }
    }
}
