<?php

namespace App\Http\Controllers;

use App\Services\TmdbService;
use App\Support\TmdbError;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Actor page: profile plus their movies ("known for" and the full filmography).
 */
class PersonController extends Controller
{
    private const KNOWN_FOR = 10;

    public function __construct(private TmdbService $tmdb) {}

    public function show(int $id): JsonResponse
    {
        try {
            $person = $this->tmdb->person($id);
        } catch (RuntimeException $e) {
            if ($e->getCode() === 404) {
                return response()->json(['message' => 'Person not found.'], 404);
            }

            return TmdbError::response($e);
        } catch (ConnectionException) {
            return TmdbError::unreachable();
        }

        $credits = $this->credits($person['movie_credits'] ?? []);

        return response()->json([
            'id' => $person['id'],
            'name' => $person['name'],
            'biography' => $person['biography'] ?? '',
            'birthday' => $person['birthday'] ?? null,
            'deathday' => $person['deathday'] ?? null,
            'place_of_birth' => $person['place_of_birth'] ?? null,
            'profile_path' => $person['profile_path'] ?? null,
            'known_for_department' => $person['known_for_department'] ?? null,
            'known_for' => $this->knownFor($credits),
            'credits' => $credits,
        ]);
    }

    /**
     * One entry per movie: acting roles, plus directing jobs (for directors).
     * Newest first; announced movies without a release date go last.
     */
    private function credits(array $movieCredits): array
    {
        $byMovie = [];

        $roles = array_merge(
            array_map(fn ($c) => $c + ['role' => $c['character'] ?? ''], $movieCredits['cast'] ?? []),
            array_map(
                fn ($c) => $c + ['role' => $c['job'] ?? ''],
                array_filter($movieCredits['crew'] ?? [], fn ($c) => ($c['department'] ?? '') === 'Directing'),
            ),
        );

        foreach ($roles as $credit) {
            if (! empty($credit['adult'])) {
                continue;
            }

            $id = $credit['id'];
            $role = trim($credit['role']);

            if (isset($byMovie[$id])) {
                // Same movie twice (e.g. acted and directed): merge the roles.
                if ($role !== '' && ! in_array($role, $byMovie[$id]['roles'], true)) {
                    $byMovie[$id]['roles'][] = $role;
                }

                continue;
            }

            $byMovie[$id] = [
                'id' => $id,
                'title' => $credit['title'] ?? '',
                'poster_path' => $credit['poster_path'] ?? null,
                'release_date' => ($credit['release_date'] ?? '') ?: null,
                'vote_average' => $credit['vote_average'] ?? 0,
                'vote_count' => $credit['vote_count'] ?? 0,
                'roles' => $role !== '' ? [$role] : [],
            ];
        }

        // Skip documentaries and making-ofs where they only appear as themselves.
        $list = array_values(array_filter($byMovie, fn ($movie) => ! $this->onlySelf($movie['roles'])));
        usort($list, fn ($a, $b) => ($b['release_date'] ?? '0000') <=> ($a['release_date'] ?? '0000'));

        return $list;
    }

    /**
     * True when every role is "Self", "Himself", "Herself" or archive footage.
     */
    private function onlySelf(array $roles): bool
    {
        if ($roles === []) {
            return false;
        }

        foreach ($roles as $role) {
            if (! preg_match('/^(self|himself|herself|themselves)\b|archive footage/i', $role)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Their best-known movies: the most voted on TMDB, with a poster.
     */
    private function knownFor(array $credits): array
    {
        $withPoster = array_values(array_filter($credits, fn ($c) => $c['poster_path']));
        usort($withPoster, fn ($a, $b) => $b['vote_count'] <=> $a['vote_count']);

        return array_slice($withPoster, 0, self::KNOWN_FOR);
    }
}
