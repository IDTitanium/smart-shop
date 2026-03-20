<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'rating',
        'reviews_count',
        'category',
        'image_url',
        'is_prime',
        'tags',
    ];

    protected $casts = [
        'price'    => 'decimal:2',
        'rating'   => 'decimal:1',
        'is_prime' => 'boolean',
        'tags'     => 'array',
    ];

    protected $hidden = ['embedding'];

    /**
     * Store an embedding vector on this product.
     * Uses raw SQL because Eloquent doesn't natively handle vector types.
     */
    public function updateEmbedding(array $vector): void
    {
        $vectorString = '[' . implode(',', $vector) . ']';

        DB::statement(
            'UPDATE products SET embedding = ?::vector WHERE id = ?',
            [$vectorString, $this->id]
        );
    }

    /**
     * Semantic search via the Supabase RPC function.
     *
     * This calls the `search_products` function we created in the SQL editor,
     * which uses pgvector's cosine distance operator internally.
     */
    public static function searchByEmbedding(array $queryEmbedding, int $limit = 20, float $maxDistance = 0.5): Collection
    {
        $vectorString = '[' . implode(',', $queryEmbedding) . ']';

        return collect(DB::select(
            'SELECT * FROM search_products(?::vector, ?, ?)',
            [$vectorString, $limit, $maxDistance]
        ));
    }

    /**
     * Hybrid search via the Supabase RPC function.
     *
     * Combines semantic similarity (70%) with full-text keyword matching (30%).
     */
    public static function hybridSearch(array $queryEmbedding, string $queryText, int $limit = 20): Collection
    {
        $vectorString = '[' . implode(',', $queryEmbedding) . ']';

        return collect(DB::select(
            'SELECT * FROM hybrid_search_products(?::vector, ?, ?)',
            [$vectorString, $queryText, $limit]
        ));
    }

    /**
     * Find similar products via the Supabase RPC function.
     */
    public static function findSimilar(int $productId, int $limit = 6): Collection
    {
        return collect(DB::select(
            'SELECT * FROM similar_products(?, ?)',
            [$productId, $limit]
        ));
    }

    /**
     * Generate the text that will be embedded for this product.
     */
    public function toEmbeddingText(): string
    {
        $tags = is_array($this->tags) ? implode(', ', $this->tags) : '';

        return implode('. ', array_filter([
            $this->name,
            $this->description,
            "Category: {$this->category}",
            $tags ? "Tags: {$tags}" : null,
        ]));
    }
}