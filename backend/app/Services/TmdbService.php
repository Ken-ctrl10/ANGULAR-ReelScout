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
    /**
     * Home page rows: our category name => TMDB path.
     */
    public const LISTS = [
        'trending' => '/trending/movie/week',
        'now-playing' => '/movie/now_playing',
        'upcoming' => '/movie/upcoming',
        'top-rated' => '/movie/top_rated',
        'popular' => '/movie/popular',
    ];

    /**
     * Sort options allowed on the Browse page (TMDB discover sort_by values).
     */
    public const SORTS = [
        'popularity.desc',
        'vote_average.desc',
        'primary_release_date.desc',
        'revenue.desc',
    ];

    public function popular(int $page = 1): array
    {
        return $this->list('popular', $page);
    }

    public function list(string $category, int $page = 1): array
    {
        $path = self::LISTS[$category] ?? throw new RuntimeException('Unknown list', 404);

        // Lists change slowly, so cache them to save TMDB calls.
        return Cache::remember("tmdb.list.$category.$page", now()->addMinutes(30), fn () =>
            $this->get($path, ['page' => $page])
        );
    }

    public function search(string $query, int $page = 1): array
    {
        $key = 'tmdb.search.'.md5(mb_strtolower($query)).".$page";

        return Cache::remember($key, now()->addMinutes(10), fn () =>
            $this->get('/search/movie', ['query' => $query, 'page' => $page, 'include_adult' => 'false'])
        );
    }

    /**
     * Browse with filters. $filters keys: genre, year, min_rating, sort.
     */
    public function discover(array $filters, int $page = 1): array
    {
        $query = array_filter([
            'with_genres' => $filters['genre'] ?? null,
            'primary_release_year' => $filters['year'] ?? null,
            'vote_average.gte' => $filters['min_rating'] ?? null,
            'sort_by' => $filters['sort'] ?? 'popularity.desc',
        ], fn ($value) => $value !== null && $value !== '');

        // Rating sorts need a minimum number of votes, or obscure 10/10 movies with 1 vote win.
        if (str_starts_with($query['sort_by'], 'vote_average') || isset($query['vote_average.gte'])) {
            $query['vote_count.gte'] = 200;
        }

        $query += ['page' => $page, 'include_adult' => 'false'];
        ksort($query);

        return Cache::remember('tmdb.discover.'.md5(http_build_query($query)), now()->addMinutes(30), fn () =>
            $this->get('/discover/movie', $query)
        );
    }

    public function genres(): array
    {
        return Cache::remember('tmdb.genres', now()->addDay(), fn () =>
            $this->get('/genre/movie/list')['genres'] ?? []
        );
    }

    public function details(int $id): array
    {
        // "full" = includes credits and videos (older cache entries had credits only).
        return Cache::remember("tmdb.movie.full.$id", now()->addHours(6), fn () =>
            $this->get("/movie/$id", ['append_to_response' => 'credits,videos'])
        );
    }

    public function recommendations(int $id): array
    {
        return Cache::remember("tmdb.recommendations.$id", now()->addHours(6), fn () =>
            $this->get("/movie/$id/recommendations")['results'] ?? []
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
