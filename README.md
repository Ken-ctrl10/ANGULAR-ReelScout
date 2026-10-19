# Reel Scout

Browse popular movies, search, and view details. Angular frontend, Laravel API, movie data from [TMDB](https://www.themoviedb.org).

```
Angular (localhost:4200)  ->  Laravel API (localhost:8000)  ->  TMDB
```

Angular never calls TMDB directly. Laravel keeps the TMDB token in `backend/.env`, proxies the requests, and caches the responses.

## Status

| Phase | Status |
|---|---|
| 1. Laravel API (TMDB proxy, caching, error handling, CORS) | Done |
| 2. Angular browsing (popular grid, debounced search, detail page, loading/error states) | Done |
| 3. Accounts and favorites (Sanctum, MySQL) | Next |
| 4. Polish | Partly done (responsive layout, TMDB attribution). Planned: movie trailer (YouTube) and cast photos on the detail page, automated tests |
| 5. Cloud hosting | Not started |

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/movies/popular?page=1` | Popular movies |
| `GET /api/movies/search?q=batman&page=1` | Search |
| `GET /api/movies/{id}` | Details with cast |

## Setup

Requirements: PHP 8.2+, Composer, Node 24.12+ (or 22.12+).

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Put your TMDB **API Read Access Token** (themoviedb.org > Settings > API) in `backend/.env`:

```
TMDB_TOKEN=your_token_here
```

```bash
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200.

## Key files

- `backend/app/Services/TmdbService.php`: calls TMDB with the token and caches responses
- `backend/app/Http/Controllers/MovieController.php`: endpoints, validation, error mapping (404, 429, etc.)
- `backend/config/cors.php`: allows only the Angular origin
- `frontend/src/app/core/movie.service.ts`: Angular `HttpClient` calls to the API
- `frontend/src/app/pages/movie-list/`: popular grid, debounced search, pagination
- `frontend/src/app/pages/movie-detail/`: lazy-loaded detail page

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
