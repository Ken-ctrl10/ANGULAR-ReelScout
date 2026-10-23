<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_adding_a_favorite_and_adding_it_again_does_not_duplicate(): void
    {
        $movie = ['tmdb_id' => 27205, 'title' => 'Inception', 'poster_path' => '/x.jpg'];

        $this->postJson('/api/favorites', $movie)
            ->assertCreated()
            ->assertJsonPath('status', 'want_to_watch')
            ->assertJsonMissingPath('user_id');
        $this->postJson('/api/favorites', $movie)->assertOk();

        $this->assertSame(1, $this->user->favorites()->count());
    }

    public function test_adding_a_favorite_validates_input(): void
    {
        $this->postJson('/api/favorites', ['poster_path' => '/x.jpg'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tmdb_id', 'title']);
    }

    public function test_users_only_see_their_own_favorites(): void
    {
        $this->user->favorites()->create(['tmdb_id' => 1, 'title' => 'Mine']);
        User::factory()->create()->favorites()->create(['tmdb_id' => 2, 'title' => 'Not mine']);

        $this->getJson('/api/favorites')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Mine');
    }

    public function test_watchlist_fields_can_be_updated(): void
    {
        $this->user->favorites()->create(['tmdb_id' => 27205, 'title' => 'Inception']);

        $this->patchJson('/api/favorites/27205', ['status' => 'watched', 'rating' => 5, 'note' => 'Loved it'])
            ->assertOk()
            ->assertJsonPath('status', 'watched')
            ->assertJsonPath('rating', 5)
            ->assertJsonPath('note', 'Loved it');

        // Only the fields sent are changed; null clears the rating.
        $this->patchJson('/api/favorites/27205', ['rating' => null])
            ->assertOk()
            ->assertJsonPath('rating', null)
            ->assertJsonPath('status', 'watched');
    }

    public function test_watchlist_update_validates_input(): void
    {
        $this->user->favorites()->create(['tmdb_id' => 27205, 'title' => 'Inception']);

        $this->patchJson('/api/favorites/27205', ['status' => 'maybe', 'rating' => 9, 'note' => str_repeat('a', 1001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'rating', 'note']);
    }

    public function test_users_cannot_update_someone_elses_favorite(): void
    {
        User::factory()->create()->favorites()->create(['tmdb_id' => 27205, 'title' => 'Not mine']);

        $this->patchJson('/api/favorites/27205', ['status' => 'watched'])
            ->assertNotFound()
            ->assertExactJson(['message' => 'This movie is not in your list.']);
    }

    public function test_a_favorite_can_be_removed(): void
    {
        $this->user->favorites()->create(['tmdb_id' => 27205, 'title' => 'Inception']);

        $this->deleteJson('/api/favorites/27205')->assertNoContent();

        $this->assertSame(0, $this->user->favorites()->count());
    }

    public function test_deleting_a_user_deletes_their_favorites(): void
    {
        $this->user->favorites()->create(['tmdb_id' => 27205, 'title' => 'Inception']);

        $this->user->delete();

        $this->assertDatabaseCount('favorites', 0);
    }
}
