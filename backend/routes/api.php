<?php

use App\Http\Controllers\MovieController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('movies')->controller(MovieController::class)->group(function () {
    Route::get('/popular', 'popular');
    Route::get('/search', 'search');
    Route::get('/{id}', 'show')->whereNumber('id');
});
