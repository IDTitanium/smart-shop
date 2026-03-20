<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\EmbeddingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductSearchController extends Controller
{
    public function __construct(
        private EmbeddingService $embeddingService,
    ) {}

    /**
     * POST /api/search
     *
     * Accepts a natural language query and returns semantically similar products.
     * Calls Supabase RPC functions under the hood.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:500',
            'limit' => 'sometimes|integer|min:1|max:50',
            'mode'  => 'sometimes|string|in:semantic,hybrid',
        ]);

        $query = $validated['query'];
        $limit = $validated['limit'] ?? 20;
        $mode  = $validated['mode'] ?? 'hybrid';

        // 1. Generate embedding for the user's query
        $queryEmbedding = $this->embeddingService->embed($query);

        // 2. Call the appropriate Supabase RPC function
        $results = match ($mode) {
            'semantic' => Product::searchByEmbedding($queryEmbedding, $limit),
            'hybrid'   => Product::hybridSearch($queryEmbedding, $query, $limit),
        };

        // 3. Format the response
        return response()->json([
            'query'   => $query,
            'count'   => $results->count(),
            'results' => $results->map(fn (object $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'description'   => $p->description,
                'price'         => (float) $p->price,
                'rating'        => (float) $p->rating,
                'reviews_count' => $p->reviews_count,
                'category'      => $p->category,
                'image_url'     => $p->image_url,
                'is_prime'      => $p->is_prime,
                'tags'          => json_decode($p->tags ?? '[]'),
                'similarity'    => round($p->similarity, 4),
            ]),
        ]);
    }

    /**
     * GET /api/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    /**
     * GET /api/products/{product}/similar
     *
     * Uses the Supabase RPC function to find similar products.
     */
    public function similar(Product $product, Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 6);

        $similar = Product::findSimilar($product->id, $limit);

        return response()->json([
            'product_id' => $product->id,
            'similar'    => $similar,
        ]);
    }
}