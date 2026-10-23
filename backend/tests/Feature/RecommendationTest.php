<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_needs_a_login(): void
    {
        $this->getJson('/api/recommendations')->assertUnauthorized();
    }

    public function test_no_favorites_means_no_recommendations_and_no_tmdb_calls(): void
    {
        Http::fake();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/recommendations')->assertOk()->assertExactJson(['based_on' => [], 'results' => []]);

        Http::assertNothingSent();
    }

    public function test_recommendations_mix_lists_and_skip_saved_movies_and_duplicates(): void
    {
        $user = User::factory()->create();
        $user->favorites()->create(['tmdb_id' => 100, 'title' => 'Inception']);
        $user->favorites()->create(['tmdb_id' => 200, 'title' => 'Interstellar']);
        Sanctum::actingAs($user);

        Http::fake([
            // Recommendations for Inception include a saved movie (200) and a shared one (3).
            'api.themoviedb.org/3/movie/100/recommendations*' => Http::response($this->tmdbPage([['id' => 1], ['id' => 200], ['id' => 3]])),
            'api.themoviedb.org/3/movie/200/recommendations*' => Http::response($this->tmdbPage([['id' => 2], ['id' => 3], ['id' => 4]])),
        ]);

        $response = $this->getJson('/api/recommendations')->assertOk();

        $this->assertEqualsCanonicalizing(['Inception', 'Interstellar'], array_column($response->json('based_on'), 'title'));
        // One from each list in turn, no saved movies (100, 200), no duplicates (3 once).
        $this->assertSame([2, 1, 3, 4], array_column($response->json('results'), 'id'));
    }

    public function test_one_failing_movie_does_not_break_the_row(): void
    {
        $user = User::factory()->create();
        $user->favorites()->create(['tmdb_id' => 100, 'title' => 'Exists']);
        $user->favorites()->create(['tmdb_id' => 999, 'title' => 'Removed from TMDB']);
        Sanctum::actingAs($user);

        Http::fake([
            'api.themoviedb.org/3/movie/100/recommendations*' => Http::response($this->tmdbPage([['id' => 1]])),
            'api.themoviedb.org/3/movie/999/recommendations*' => Http::response([], 404),
        ]);

        $this->getJson('/api/recommendations')->assertOk()->assertJsonPath('results.0.id', 1);
    }
}
