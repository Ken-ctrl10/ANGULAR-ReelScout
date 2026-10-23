<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MovieApiTest extends TestCase
{
    public function test_popular_returns_tmdb_movies_and_sends_the_token(): void
    {
        Http::fake(['api.themoviedb.org/3/movie/popular*' => Http::response($this->tmdbPage([['id' => 1, 'title' => 'Inception']]))]);

        $this->getJson('/api/movies/popular')
            ->assertOk()
            ->assertJsonPath('results.0.title', 'Inception');

        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer test-token'));
    }

    public function test_home_page_lists_use_the_right_tmdb_endpoints(): void
    {
        Http::fake([
            'api.themoviedb.org/3/trending/movie/week*' => Http::response($this->tmdbPage([['id' => 1]])),
            'api.themoviedb.org/3/movie/now_playing*' => Http::response($this->tmdbPage([['id' => 2]])),
            'api.themoviedb.org/3/movie/upcoming*' => Http::response($this->tmdbPage([['id' => 3]])),
            'api.themoviedb.org/3/movie/top_rated*' => Http::response($this->tmdbPage([['id' => 4]])),
        ]);

        $this->getJson('/api/movies/list/trending')->assertOk()->assertJsonPath('results.0.id', 1);
        $this->getJson('/api/movies/list/now-playing')->assertOk()->assertJsonPath('results.0.id', 2);
        $this->getJson('/api/movies/list/upcoming')->assertOk()->assertJsonPath('results.0.id', 3);
        $this->getJson('/api/movies/list/top-rated')->assertOk()->assertJsonPath('results.0.id', 4);
    }

    public function test_unknown_list_is_not_found(): void
    {
        $this->getJson('/api/movies/list/bogus')->assertNotFound();
    }

    public function test_responses_are_cached(): void
    {
        Http::fake(['api.themoviedb.org/*' => Http::response($this->tmdbPage([['id' => 1]]))]);

        $this->getJson('/api/movies/list/trending')->assertOk();
        $this->getJson('/api/movies/list/trending')->assertOk();

        Http::assertSentCount(1);
    }

    public function test_search_requires_a_query(): void
    {
        $this->getJson('/api/movies/search')->assertUnprocessable()->assertJsonValidationErrors('q');
        $this->getJson('/api/movies/search?q='.str_repeat('a', 101))->assertUnprocessable();
    }

    public function test_discover_sends_the_filters_to_tmdb(): void
    {
        Http::fake(['api.themoviedb.org/3/discover/movie*' => Http::response($this->tmdbPage([['id' => 27205]]))]);

        $this->getJson('/api/movies/discover?genre=28&year=2010&min_rating=7&sort=vote_average.desc')
            ->assertOk()
            ->assertJsonPath('results.0.id', 27205);

        Http::assertSent(function (Request $request) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);

            return $query['with_genres'] === '28'
                && $query['primary_release_year'] === '2010'
                && $query['vote_average_gte'] === '7'   // PHP turns "." into "_" when parsing
                && $query['vote_count_gte'] === '200'   // rating filters need enough votes
                && $query['sort_by'] === 'vote_average.desc';
        });
    }

    public function test_discover_rejects_invalid_filters(): void
    {
        $this->getJson('/api/movies/discover?sort=bad')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/movies/discover?year=1800')->assertUnprocessable()->assertJsonValidationErrors('year');
        $this->getJson('/api/movies/discover?min_rating=11')->assertUnprocessable()->assertJsonValidationErrors('min_rating');
    }

    public function test_genres_returns_the_genre_list(): void
    {
        Http::fake(['api.themoviedb.org/3/genre/movie/list*' => Http::response(['genres' => [['id' => 28, 'name' => 'Action']]])]);

        $this->getJson('/api/genres')->assertOk()->assertExactJson([['id' => 28, 'name' => 'Action']]);
    }

    public function test_details_include_cast_and_videos(): void
    {
        Http::fake(['api.themoviedb.org/3/movie/27205*' => Http::response(['id' => 27205, 'title' => 'Inception'])]);

        $this->getJson('/api/movies/27205')->assertOk()->assertJsonPath('title', 'Inception');

        Http::assertSent(fn (Request $request) => str_contains(urldecode($request->url()), 'append_to_response=credits,videos'));
    }

    public function test_tmdb_errors_become_clean_messages(): void
    {
        Http::fake([
            'api.themoviedb.org/3/movie/999*' => Http::response(['status_message' => 'not found'], 404),
            'api.themoviedb.org/3/movie/popular*' => Http::response([], 429),
        ]);

        $this->getJson('/api/movies/999')->assertNotFound()->assertExactJson(['message' => 'Movie not found.']);
        $this->getJson('/api/movies/popular')->assertStatus(429);
    }

    public function test_the_tmdb_token_is_never_returned(): void
    {
        Http::fake(['api.themoviedb.org/*' => Http::response($this->tmdbPage([['id' => 1]]))]);

        $this->assertStringNotContainsString('test-token', $this->getJson('/api/movies/popular')->getContent());
    }
}
