<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class EmbeddingService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->model  = config('services.openai.embedding_model', 'text-embedding-3-small');
    }

    /**
     * Generate an embedding for a single text string.
     *
     * Caches results to avoid redundant API calls for identical queries.
     */
    public function embed(string $text): array
    {
        $cacheKey = 'embedding:' . md5($this->model . $text);

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($text) {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->post('https://api.openai.com/v1/embeddings', [
                'model' => $this->model,
                'input' => $text,
            ]);

            if ($response->failed()) {
                throw new \RuntimeException(
                    'OpenAI embedding request failed: ' . $response->body()
                );
            }

            return $response->json('data.0.embedding');
        });
    }

    /**
     * Generate embeddings for multiple texts in a single batch request.
     *
     * More efficient than calling embed() in a loop.
     * Returns an array of embedding vectors in the same order as input.
     */
    public function embedBatch(array $texts): array
    {
        // Check cache first, only send uncached texts to the API
        $results    = [];
        $uncached   = [];
        $uncachedIdx = [];

        foreach ($texts as $i => $text) {
            $cacheKey = 'embedding:' . md5($this->model . $text);
            $cached   = Cache::get($cacheKey);

            if ($cached !== null) {
                $results[$i] = $cached;
            } else {
                $uncached[]    = $text;
                $uncachedIdx[] = $i;
            }
        }

        if (! empty($uncached)) {
            // OpenAI supports batch embedding in a single request
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->post('https://api.openai.com/v1/embeddings', [
                'model' => $this->model,
                'input' => $uncached,
            ]);

            if ($response->failed()) {
                throw new \RuntimeException(
                    'OpenAI batch embedding request failed: ' . $response->body()
                );
            }

            $embeddings = collect($response->json('data'))
                ->sortBy('index')
                ->pluck('embedding')
                ->values()
                ->all();

            foreach ($embeddings as $j => $embedding) {
                $origIdx = $uncachedIdx[$j];
                $results[$origIdx] = $embedding;

                // Cache each result
                $cacheKey = 'embedding:' . md5($this->model . $uncached[$j]);
                Cache::put($cacheKey, $embedding, now()->addDays(7));
            }
        }

        ksort($results);

        return array_values($results);
    }
}