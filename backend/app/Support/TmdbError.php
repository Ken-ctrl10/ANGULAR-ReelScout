<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Maps TMDB failures (thrown by TmdbService with TMDB's status as the code)
 * to clean JSON errors. Shared by MovieController and RecommendationController.
 */
class TmdbError
{
    public static function response(RuntimeException $e): JsonResponse
    {
        [$status, $message] = match ($e->getCode()) {
            404 => [404, 'Movie not found.'],
            429 => [429, 'Too many requests to TMDB. Please try again shortly.'],
            401 => [502, 'TMDB rejected the API token. Check TMDB_TOKEN in .env.'],
            500 => [500, $e->getMessage()],
            default => [502, 'Could not reach TMDB. Please try again.'],
        };

        return response()->json(['message' => $message], $status);
    }

    public static function unreachable(): JsonResponse
    {
        return response()->json(['message' => 'Could not reach TMDB. Please try again.'], 502);
    }
}
