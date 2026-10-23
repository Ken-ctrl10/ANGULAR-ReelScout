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
| 3. Accounts and favorites (Sanctum, MySQL) | Done: auth and favorites API on MySQL, login/register, token interceptor, favorite button, My Favorites page, route guards |
| 4. Polish | Partly done (responsive layout, TMDB attribution). Planned: movie trailer (YouTube) and cast photos on the detail page, automated tests |
| 5. Cloud hosting | Not started |

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/movies/popular?page=1` | Popular movies |
| `GET /api/movies/search?q=batman&page=1` | Search |
| `GET /api/movies/{id}` | Details with cast |
| `POST /api/register` | Create an account (`name`, `email`, `password`, `password_confirmation`); returns user and token |
| `POST /api/login` | Log in (`email`, `password`); returns user and token |

These need `Authorization: Bearer <token>`:

| Endpoint | Purpose |
|---|---|
| `GET /api/user` | The logged-in user |
| `POST /api/logout` | Revoke the current token |
| `GET /api/favorites` | My favorites, newest first |
| `POST /api/favorites` | Add a favorite (`tmdb_id`, `title`, `poster_path`); adding twice doesn't duplicate |
| `DELETE /api/favorites/{tmdbId}` | Remove a favorite |

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

## Key files

- `backend/app/Services/TmdbService.php`: calls TMDB with the token and caches responses
- `backend/app/Http/Controllers/MovieController.php`: endpoints, validation, error mapping (404, 429, etc.)
- `backend/config/cors.php`: allows only the Angular origin
- `frontend/src/app/core/movie.service.ts`: Angular `HttpClient` calls to the API
- `frontend/src/app/pages/movie-list/`: popular grid, debounced search, pagination
- `frontend/src/app/pages/movie-detail/`: lazy-loaded detail page
- `backend/app/Http/Controllers/AuthController.php`: register, login, logout, current user (Sanctum tokens)
- `backend/app/Http/Controllers/FavoriteController.php`: list, add, remove favorites for the logged-in user
- `backend/app/Models/Favorite.php` and the `favorites` migration: one row per user and movie (unique pair)
- `frontend/src/app/core/auth.service.ts`: login state as signals, token saved in localStorage
- `frontend/src/app/core/auth.interceptor.ts`: adds the Bearer token to API calls, logs out on 401
- `frontend/src/app/pages/login/`, `pages/register/`: reactive forms with client and server validation
- `frontend/src/app/core/favorites.service.ts`: favorites as signals, loads on login and clears on logout
- `frontend/src/app/core/auth.guard.ts`: `authGuard` (logged-in only, e.g. `/favorites`) and `guestGuard` (login/register)
- `frontend/src/app/shared/favorite-button.ts`: reusable add/remove favorite button
- `frontend/src/app/pages/favorites/`: My Favorites page

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
