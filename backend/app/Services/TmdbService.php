<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Talks to the TMDB API. The token stays on the server (.env),
 * so the Angular app never sees it.
 */
class TmdbService
{
    public function popular(int $page = 1): array
    {
        // Popular lists change slowly, so cache them to save TMDB calls.
        return Cache::remember("tmdb.popular.$page", now()->addMinutes(30), fn () =>
            $this->get('/movie/popular', ['page' => $page])
        );
    }

    public function search(string $query, int $page = 1): array
    {
        $key = 'tmdb.search.'.md5(mb_strtolower($query)).".$page";

        return Cache::remember($key, now()->addMinutes(10), fn () =>
            $this->get('/search/movie', ['query' => $query, 'page' => $page, 'include_adult' => 'false'])
        );
    }

    public function details(int $id): array
    {
        return Cache::remember("tmdb.movie.$id", now()->addHours(6), fn () =>
            $this->get("/movie/$id", ['append_to_response' => 'credits'])
        );
    }

    private function get(string $path, array $query = []): array
    {
        $response = $this->client()->get($path, $query);

        if ($response->failed()) {
            // Keep TMDB's status (404, 429, ...) so the controller can pass it on.
            throw new RuntimeException('TMDB request failed', $response->status());
        }

        return $response->json();
    }

    private function client(): PendingRequest
    {
        $token = config('services.tmdb.token');

        if (empty($token)) {
            throw new RuntimeException('TMDB_TOKEN is not set in .env', 500);
        }

        return Http::baseUrl(config('services.tmdb.base_url'))
            ->withToken($token)
            ->acceptJson()
            ->timeout(10);
    }
}
