<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\EmbeddingService;
use Illuminate\Console\Command;

class GenerateProductEmbeddings extends Command
{
    protected $signature = 'products:embed
                            {--force : Re-generate embeddings even if they already exist}
                            {--batch-size=50 : Number of products to embed per API call}';

    protected $description = 'Generate vector embeddings for all products using OpenAI';

    public function handle(EmbeddingService $embeddingService): int
    {
        $query = Product::query();

        if (! $this->option('force')) {
            $query->whereNull('embedding');
        }

        $total     = $query->count();
        $batchSize = (int) $this->option('batch-size');

        if ($total === 0) {
            $this->info('All products already have embeddings. Use --force to regenerate.');
            return self::SUCCESS;
        }

        $this->info("Generating embeddings for {$total} products...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunkById($batchSize, function ($products) use ($embeddingService, $bar) {
            // Prepare texts for batch embedding
            $texts = $products->map(fn (Product $p) => $p->toEmbeddingText())->all();

            try {
                $embeddings = $embeddingService->embedBatch($texts);
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("API error: {$e->getMessage()}");
                return false; // Stop chunking
            }

            // Save each embedding
            foreach ($products->values() as $i => $product) {
                $product->updateEmbedding($embeddings[$i]);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info('Done! All product embeddings have been generated.');

        return self::SUCCESS;
    }
}