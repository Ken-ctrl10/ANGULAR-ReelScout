<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\RecommendationController;
use App\Services\TmdbService;
use Illuminate\Support\Facades\Route;

// Public: movie data from TMDB
Route::prefix('movies')->controller(MovieController::class)->group(function () {
    Route::get('/popular', 'popular');
    Route::get('/search', 'search');
    Route::get('/discover', 'discover');
    Route::get('/list/{category}', 'list')->whereIn('category', array_keys(TmdbService::LISTS));
    Route::get('/{id}', 'show')->whereNumber('id');
});
Route::get('/genres', [MovieController::class, 'genres']);

// Public: auth (max 10 attempts per minute to slow down password guessing)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Logged in only: needs "Authorization: Bearer <token>"
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::patch('/favorites/{tmdbId}', [FavoriteController::class, 'update'])->whereNumber('tmdbId');
    Route::delete('/favorites/{tmdbId}', [FavoriteController::class, 'destroy'])->whereNumber('tmdbId');

    Route::get('/recommendations', [RecommendationController::class, 'index']);
});
