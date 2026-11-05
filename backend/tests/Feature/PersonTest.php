<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PersonTest extends TestCase
{
    private function fakePerson(array $cast, array $crew = []): void
    {
        Http::fake(['api.themoviedb.org/3/person/6193*' => Http::response([
            'id' => 6193,
            'name' => 'Leonardo DiCaprio',
            'biography' => 'An American actor.',
            'birthday' => '1974-11-11',
            'deathday' => null,
            'place_of_birth' => 'Los Angeles, California, USA',
            'profile_path' => '/leo.jpg',
            'known_for_department' => 'Acting',
            'movie_credits' => ['cast' => $cast, 'crew' => $crew],
        ])]);
    }

    private function credit(int $id, string $title, ?string $date, int $votes, array $extra = []): array
    {
        return $extra + [
            'id' => $id,
            'title' => $title,
            'release_date' => $date ?? '',
            'poster_path' => "/$id.jpg",
            'vote_average' => 7.5,
            'vote_count' => $votes,
            'adult' => false,
        ];
    }

    public function test_it_returns_the_profile_and_asks_tmdb_for_movie_credits(): void
    {
        $this->fakePerson([$this->credit(27205, 'Inception', '2010-07-15', 38000, ['character' => 'Dom Cobb'])]);

        $this->getJson('/api/people/6193')
            ->assertOk()
            ->assertJsonPath('name', 'Leonardo DiCaprio')
            ->assertJsonPath('place_of_birth', 'Los Angeles, California, USA')
            ->assertJsonPath('credits.0.title', 'Inception')
            ->assertJsonPath('credits.0.roles', ['Dom Cobb']);

        Http::assertSent(fn (Request $request) => str_contains($request->url(), 'append_to_response=movie_credits'));
    }

    public function test_credits_are_newest_first_with_announced_movies_last(): void
    {
        $this->fakePerson([
            $this->credit(1, 'Old', '1997-12-19', 100),
            $this->credit(2, 'Announced', null, 0),
            $this->credit(3, 'New', '2023-10-20', 100),
        ]);

        $this->assertSame(['New', 'Old', 'Announced'], array_column($this->getJson('/api/people/6193')->json('credits'), 'title'));
    }

    public function test_acting_and_directing_the_same_movie_is_one_entry_with_both_roles(): void
    {
        $this->fakePerson(
            [$this->credit(10, 'Self Directed', '2020-01-01', 50, ['character' => 'Hero'])],
            [
                $this->credit(10, 'Self Directed', '2020-01-01', 50, ['job' => 'Director', 'department' => 'Directing']),
                $this->credit(11, 'Only Produced', '2021-01-01', 50, ['job' => 'Producer', 'department' => 'Production']),
            ],
        );

        $credits = $this->getJson('/api/people/6193')->json('credits');

        $this->assertCount(1, $credits); // producing is not listed
        $this->assertSame(['Hero', 'Director'], $credits[0]['roles']);
    }

    public function test_writing_credits_are_included(): void
    {
        $this->fakePerson([], [
            $this->credit(20, 'Batman', '1989-06-23', 500, ['job' => 'Characters', 'department' => 'Writing']),
        ]);

        $this->getJson('/api/people/6193')
            ->assertJsonPath('credits.0.title', 'Batman')
            ->assertJsonPath('credits.0.roles', ['Characters']);
    }

    public function test_known_for_is_the_most_voted_movies_with_posters(): void
    {
        $this->fakePerson([
            $this->credit(1, 'Small', '2001-01-01', 10),
            $this->credit(2, 'Huge', '2010-01-01', 40000),
            $this->credit(3, 'No poster', '2015-01-01', 99999, ['poster_path' => null]),
            $this->credit(4, 'Big', '1997-01-01', 25000),
        ]);

        $this->assertSame(['Huge', 'Big', 'Small'], array_column($this->getJson('/api/people/6193')->json('known_for'), 'title'));
    }

    public function test_adult_titles_are_hidden(): void
    {
        $this->fakePerson([
            $this->credit(1, 'Normal', '2001-01-01', 10),
            $this->credit(2, 'Adult', '2002-01-01', 10, ['adult' => true]),
        ]);

        $this->assertSame(['Normal'], array_column($this->getJson('/api/people/6193')->json('credits'), 'title'));
    }

    public function test_appearances_as_themselves_are_hidden(): void
    {
        $this->fakePerson([
            $this->credit(1, 'Real role', '2010-01-01', 10, ['character' => 'Dom Cobb']),
            $this->credit(2, 'Making-of', '2011-01-01', 10, ['character' => 'Self']),
            $this->credit(3, 'Documentary', '2012-01-01', 10, ['character' => 'Himself']),
            $this->credit(4, 'Old clip', '2013-01-01', 10, ['character' => 'Self (archive footage)']),
        ]);

        $this->assertSame(['Real role'], array_column($this->getJson('/api/people/6193')->json('credits'), 'title'));
    }

    public function test_unknown_person_is_a_clean_404(): void
    {
        Http::fake(['api.themoviedb.org/3/person/*' => Http::response(['status_message' => 'not found'], 404)]);

        $this->getJson('/api/people/999999999')->assertNotFound()->assertExactJson(['message' => 'Person not found.']);
        $this->getJson('/api/people/abc')->assertNotFound();
    }
}
