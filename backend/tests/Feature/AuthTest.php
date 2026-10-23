<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Ken',
            'email' => 'ken@example.test',
            'password' => 'secret-pass-1',
            'password_confirmation' => 'secret-pass-1',
        ])
            ->assertCreated()
            ->assertJsonPath('user.email', 'ken@example.test')
            ->assertJsonMissingPath('user.password')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', ['email' => 'ken@example.test']);
    }

    public function test_register_validates_input(): void
    {
        User::factory()->create(['email' => 'taken@example.test']);

        $this->postJson('/api/register', [
            'name' => 'Ken',
            'email' => 'taken@example.test',
            'password' => 'secret-pass-1',
            'password_confirmation' => 'something-else',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_with_a_wrong_password_gives_one_generic_message(): void
    {
        User::factory()->create(['email' => 'ken@example.test', 'password' => 'right-pass-1']);

        $this->postJson('/api/login', ['email' => 'ken@example.test', 'password' => 'wrong-pass'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'The email or password is incorrect.');

        // Same message for an email that doesn't exist.
        $this->postJson('/api/login', ['email' => 'nobody@example.test', 'password' => 'wrong-pass'])
            ->assertJsonPath('errors.email.0', 'The email or password is incorrect.');
    }

    public function test_login_returns_a_token_that_works(): void
    {
        User::factory()->create(['email' => 'ken@example.test', 'password' => 'right-pass-1']);

        $token = $this->postJson('/api/login', ['email' => 'ken@example.test', 'password' => 'right-pass-1'])
            ->assertOk()
            ->json('token');

        $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('email', 'ken@example.test');
    }

    public function test_protected_routes_need_a_token(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->get('/api/favorites')->assertUnauthorized(); // even without "Accept: application/json"
    }

    public function test_logout_revokes_the_token(): void
    {
        $token = User::factory()->create()->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertNoContent();

        // Laravel remembers the logged-in user within one test; forget it to simulate a new request.
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }
}
