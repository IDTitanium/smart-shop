<?php

// =============================================================
// FILE: routes/api.php
// =============================================================

use App\Http\Controllers\Api\ProductSearchController;
use Illuminate\Support\Facades\Route;

Route::post('/search', [ProductSearchController::class, 'search']);
Route::get('/products/{product}', [ProductSearchController::class, 'show']);
Route::get('/products/{product}/similar', [ProductSearchController::class, 'similar']);


// =============================================================
// FILE: config/services.php  (add this to the existing array)
// =============================================================

// 'openai' => [
//     'api_key'         => env('OPENAI_API_KEY'),
//     'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
// ],


// =============================================================
// FILE: .env  (add these entries)
// =============================================================

// OPENAI_API_KEY=sk-your-key-here
// OPENAI_EMBEDDING_MODEL=text-embedding-3-small


// =============================================================
// FILE: app/Providers/AppServiceProvider.php (register as singleton)
// =============================================================

// use App\Services\EmbeddingService;
//
// public function register(): void
// {
//     $this->app->singleton(EmbeddingService::class);
// }


// =============================================================
// SETUP COMMANDS (run in order)
// =============================================================

// 1. Install pgvector on your Postgres server:
//    sudo apt install postgresql-16-pgvector
//
// 2. Run the migration:
//    php artisan migrate
//
// 3. Seed your products (use a standard seeder or import)
//    php artisan db:seed --class=ProductSeeder
//
// 4. Generate embeddings for all products:
//    php artisan products:embed
//
// 5. Test the search:
//    curl -X POST http://localhost:8000/api/search \
//      -H "Content-Type: application/json" \
//      -d '{"query": "something to keep my drinks cold on hikes"}'