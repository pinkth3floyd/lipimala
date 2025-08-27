import { pipeline } from "@huggingface/transformers";

declare global {
    var PipelineManager: unknown;
}

// Define interfaces
interface TranslationPipeline {
    (text: string, options?: { src_lang?: string; tgt_lang?: string }): Promise<unknown>;
}

interface GrammarPipeline {
    (text: string): Promise<unknown>;
}

interface PipelineCache {
    instance: TranslationPipeline | GrammarPipeline | null;
    lastUsed: number;
    loading: boolean;
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 2; // Maximum number of cached pipelines

class PipelineManager {
    private static cache = new Map<string, PipelineCache>();
    private static cacheHits = 0;
    private static cacheMisses = 0;

    static async getTranslationPipeline(): Promise<TranslationPipeline> {
        const cacheKey = 'translation';
        return this.getPipeline(cacheKey, this.createTranslationPipeline) as Promise<TranslationPipeline>;
    }

    static async getGrammarPipeline(): Promise<GrammarPipeline> {
        const cacheKey = 'grammar';
        return this.getPipeline(cacheKey, this.createGrammarPipeline) as Promise<GrammarPipeline>;
    }

    private static async getPipeline<T>(
        cacheKey: string, 
        createPipeline: () => Promise<T>
    ): Promise<T> {
        const now = Date.now();
        let cacheEntry = this.cache.get(cacheKey);

        // Check if cache entry exists and is valid
        if (cacheEntry && cacheEntry.instance && (now - cacheEntry.lastUsed) < CACHE_DURATION) {
            cacheEntry.lastUsed = now;
            this.cacheHits++;
            console.log(`Cache hit for ${cacheKey} pipeline`);
            return cacheEntry.instance as T;
        }

        this.cacheMisses++;
        console.log(`Cache miss for ${cacheKey} pipeline`);

        // If pipeline is already loading, wait for it
        if (cacheEntry?.loading) {
            console.log(`Waiting for ${cacheKey} pipeline to load...`);
            while (cacheEntry && cacheEntry.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
                cacheEntry = this.cache.get(cacheKey);
            }
            if (cacheEntry?.instance) {
                cacheEntry.lastUsed = now;
                return cacheEntry.instance as T;
            }
        }

        // Create new pipeline
        try {
            this.cache.set(cacheKey, { instance: null, lastUsed: now, loading: true });
            
            const instance = await createPipeline();
            
            this.cache.set(cacheKey, { 
                instance: instance as TranslationPipeline | GrammarPipeline, 
                lastUsed: now, 
                loading: false 
            });
            
            // Clean up old cache entries
            this.cleanupCache();
            
            console.log(`Successfully loaded ${cacheKey} pipeline`);
            return instance;
        } catch (error) {
            this.cache.delete(cacheKey);
            console.error(`Failed to load ${cacheKey} pipeline:`, error);
            throw error;
        }
    }

    private static async createTranslationPipeline(): Promise<TranslationPipeline> {
        console.log('Loading translation pipeline...');
        
        const pipelineInstance = await (pipeline as unknown as (task: string, model: string, options?: Record<string, unknown>) => Promise<TranslationPipeline>)(
            'translation', 
            'Xenova/nllb-200-distilled-600M',
            {
                dtype: 'fp32',
                revision: 'main',
                quantized: true,
                cache_dir: '/tmp/huggingface_cache', // Use Vercel's temp directory
                local_files_only: false
            }
        );

        console.log('Translation pipeline loaded successfully');
        return pipelineInstance;
    }

    private static async createGrammarPipeline(): Promise<GrammarPipeline> {
        console.log('Loading grammar pipeline...');
        
        const pipelineInstance = await (pipeline as unknown as (task: string, model: string, options?: Record<string, unknown>) => Promise<GrammarPipeline>)(
            'sentiment-analysis',
            'Xenova/bert-base-multilingual-uncased-sentiment',
            {
                dtype: 'fp32',
                revision: 'main',
                quantized: true,
                cache_dir: '/tmp/huggingface_cache', // Use Vercel's temp directory
                local_files_only: false
            }
        );

        console.log('Grammar pipeline loaded successfully');
        return pipelineInstance;
    }

    private static cleanupCache(): void {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        
        // Remove expired entries
        for (const [key, entry] of entries) {
            if (now - entry.lastUsed > CACHE_DURATION) {
                this.cache.delete(key);
                console.log(`Removed expired cache entry: ${key}`);
            }
        }

        // If still too many entries, remove oldest
        if (this.cache.size > MAX_CACHE_SIZE) {
            const sortedEntries = entries
                .filter(([, entry]) => !entry.loading)
                .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
            
            const toRemove = sortedEntries.slice(0, this.cache.size - MAX_CACHE_SIZE);
            for (const [key] of toRemove) {
                this.cache.delete(key);
                console.log(`Removed old cache entry: ${key}`);
            }
        }
    }

    static getCacheStats() {
        return {
            size: this.cache.size,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses)
        };
    }

    static clearCache(): void {
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        console.log('Cache cleared');
    }
}

// Initialize global cache for Vercel
const globalObj = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : globalThis;

if (process.env.NODE_ENV !== 'production') {
    if (!(globalObj as Record<string, unknown>).PipelineManager) {
        (globalObj as Record<string, unknown>).PipelineManager = PipelineManager;
    }
}

export default PipelineManager;
