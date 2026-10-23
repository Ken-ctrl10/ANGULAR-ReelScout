<?php

namespace App\Http\Controllers;

use App\Services\TmdbService;
use App\Support\TmdbError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class MovieController extends Controller
{
    public function __construct(private TmdbService $tmdb) {}

    public function popular(Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->tmdb->popular($this->page($request)));
    }

    /**
     * Home page rows: trending, now-playing, upcoming, top-rated (see TmdbService::LISTS).
     */
    public function list(Request $request, string $category): JsonResponse
    {
        return $this->respond(fn () => $this->tmdb->list($category, $this->page($request)));
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ]);

        return $this->respond(fn () => $this->tmdb->search($validated['q'], (int) ($validated['page'] ?? 1)));
    }

    /**
     * Browse page with filters: ?genre=28&year=2010&min_rating=7&sort=popularity.desc&page=1
     */
    public function discover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'genre' => ['nullable', 'integer', 'min:1'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:'.(now()->year + 2)],
            'min_rating' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'sort' => ['nullable', Rule::in(TmdbService::SORTS)],
            'page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ]);

        return $this->respond(fn () => $this->tmdb->discover($validated, (int) ($validated['page'] ?? 1)));
    }

    public function genres(): JsonResponse
    {
        return $this->respond(fn () => $this->tmdb->genres());
    }

    public function show(int $id): JsonResponse
    {
        return $this->respond(fn () => $this->tmdb->details($id));
    }

    private function page(Request $request): int
    {
        // TMDB only serves pages 1 to 500.
        return max(1, min(500, $request->integer('page', 1)));
    }

    /**
     * Turns TMDB failures into clean JSON errors for the frontend.
     */
    private function respond(callable $callback): JsonResponse
    {
        try {
            return response()->json($callback());
        } catch (RuntimeException $e) {
            return TmdbError::response($e);
        } catch (\Illuminate\Http\Client\ConnectionException) {
            return TmdbError::unreachable();
        }
    }
}
