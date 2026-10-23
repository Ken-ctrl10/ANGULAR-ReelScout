# Reel Scout

A movie browser: a streaming-style home page, browse with filters, movie details with trailers, and a personal watchlist with recommendations. Angular frontend, Laravel API, MySQL, movie data from [TMDB](https://www.themoviedb.org).

```
Angular (localhost:4200)  ->  Laravel API (localhost:8000)  ->  TMDB
                                     |
                              MySQL (users, favorites/watchlist, tokens)
```

Angular never calls TMDB directly. Laravel keeps the TMDB token in `backend/.env`, proxies the requests, and caches the responses.

## Status

| Phase | Status |
|---|---|
| 1. Laravel API (TMDB proxy, caching, error handling, CORS) | Done |
| 2. Angular browsing (grid, debounced search, detail page, loading/error states) | Done |
| 3. Accounts and favorites (Sanctum, MySQL, route guards) | Done |
| 4. Features and polish | Done: home page (hero + rows), Browse filters, recommendations, watchlist (status, rating, note), trailer, cast photos, accessibility, automated tests |
| 5. Cloud hosting | Next |

## Features

- **Home**: trending movie of the week as a hero, plus rows for Trending, Now playing, Coming soon and Top rated. Logged-in users also get "Recommended for you", based on their saved movies. Rows load as you scroll (`@defer (on viewport)`).
- **Browse** (`/browse`): search by title, or filter by genre, year, minimum rating and sort. Everything is kept in the URL.
- **Movie details**: genres, runtime, overview, cast photos, and the YouTube trailer (loaded only when you click Play).
- **Accounts**: register, log in, log out (Laravel Sanctum tokens).
- **My list** (`/favorites`): saved movies with a status (Want to watch / Watched), your own 1-5 star rating and a note.

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/movies/popular?page=1` | Popular movies |
| `GET /api/movies/list/{category}?page=1` | Home rows: `trending`, `now-playing`, `upcoming`, `top-rated` |
| `GET /api/movies/search?q=batman&page=1` | Search by title |
| `GET /api/movies/discover?genre=28&year=2010&min_rating=7&sort=vote_average.desc&page=1` | Browse with filters (all optional). Sort: `popularity.desc`, `vote_average.desc`, `primary_release_date.desc`, `revenue.desc` |
| `GET /api/genres` | Genre list |
| `GET /api/movies/{id}` | Details with cast and videos (trailers) |
| `POST /api/register` | Create an account (`name`, `email`, `password`, `password_confirmation`); returns user and token |
| `POST /api/login` | Log in (`email`, `password`); returns user and token |

These need `Authorization: Bearer <token>`:

| Endpoint | Purpose |
|---|---|
| `GET /api/user` | The logged-in user |
| `POST /api/logout` | Revoke the current token |
| `GET /api/favorites` | My list, newest first |
| `POST /api/favorites` | Add a movie (`tmdb_id`, `title`, `poster_path`); adding twice doesn't duplicate |
| `PATCH /api/favorites/{tmdbId}` | Update `status` (`want_to_watch` / `watched`), `rating` (1-5 or null), `note` |
| `DELETE /api/favorites/{tmdbId}` | Remove a movie |
| `GET /api/recommendations` | "Because you liked..." movies from your 3 latest saves, without movies you saved |

Register and login are limited to 10 attempts per minute.

## Setup

Requirements: PHP 8.3+ (with `pdo_mysql`), Composer, MySQL 8, Node 20.19+, 22.12+ or 24+.

```bash
git clone https://github.com/Ken-ctrl10/ANGULAR-ReelScout.git
cd ANGULAR-ReelScout
```

### Database (MySQL)

Create the database (for example in MySQL Workbench):

```sql
CREATE DATABASE movie_browser;
```

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

In `backend/.env`, set your MySQL password and your TMDB **API Read Access Token** (themoviedb.org > Settings > API):

```
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
TMDB_TOKEN=your_token_here
```

Create the tables and start the API:

```bash
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200.

## Tests

**Backend** (31 tests): Laravel feature tests. They use a separate MySQL database, so your data is never touched, and TMDB is faked, so no internet is needed. Create the test database once:

```sql
CREATE DATABASE movie_browser_test;
```

```bash
cd backend
php artisan test
```

**Frontend** (24 tests): Angular unit tests with Vitest.

```bash
cd frontend
npm test -- --watch=false
```

**API** (43 requests, 171 checks): import `postman/ReelScout.postman_collection.json` into Postman and run the collection against the running API.

## Key files

**Backend**
- `app/Services/TmdbService.php`: all TMDB calls (lists, search, discover, genres, details, recommendations), with the token and caching
- `app/Http/Controllers/MovieController.php`: movie endpoints and validation
- `app/Http/Controllers/AuthController.php`: register, login, logout, current user (Sanctum tokens)
- `app/Http/Controllers/FavoriteController.php`: list, add, update (watchlist), remove for the logged-in user
- `app/Http/Controllers/RecommendationController.php`: mixes TMDB recommendations from the user's latest saves
- `app/Support/TmdbError.php`: turns TMDB failures into clean JSON errors
- `app/Models/Favorite.php` and the `favorites` migrations: one row per user and movie, with status, rating and note
- `config/cors.php`: allows only the Angular origin
- `tests/Feature/`: API tests

**Frontend** (`frontend/src/app/`)
- `core/movie.service.ts`, `core/auth.service.ts`, `core/favorites.service.ts`: API calls and shared state (signals)
- `core/auth.interceptor.ts`: adds the Bearer token to API calls, logs out on 401
- `core/auth.guard.ts`: `authGuard` (logged-in only) and `guestGuard` (login/register)
- `pages/home/`: hero and movie rows
- `pages/movie-list/`: Browse page with search and filters
- `pages/movie-detail/`: details, trailer, cast
- `pages/favorites/`: My list (watchlist)
- `pages/login/`, `pages/register/`: reactive forms with client and server validation
- `shared/movie-card.ts`, `shared/movie-row.ts`, `shared/trailer-player.ts`, `shared/favorite-button.ts`: reusable components
- `*.spec.ts`: unit tests

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
