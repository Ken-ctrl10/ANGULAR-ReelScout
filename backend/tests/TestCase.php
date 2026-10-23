<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Tests must never call the real TMDB API: any HTTP call that
        // isn't faked with Http::fake() makes the test fail.
        Http::preventStrayRequests();
    }

    /**
     * A TMDB-style page of movies.
     *
     * @param  array<int, array{id: int, title?: string}>  $movies
     */
    protected function tmdbPage(array $movies, int $page = 1): array
    {
        return [
            'page' => $page,
            'results' => array_map(fn (array $m) => $m + [
                'title' => 'Movie '.$m['id'],
                'overview' => '',
                'poster_path' => null,
                'backdrop_path' => null,
                'release_date' => '2020-01-01',
                'vote_average' => 7.5,
            ], $movies),
            'total_pages' => 1,
            'total_results' => count($movies),
        ];
    }
}
