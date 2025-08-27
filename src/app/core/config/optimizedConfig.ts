// Removed unused AutoModel import

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
    error?: string;
    modelInfo?: {
        name: string;
        src_lang: string;
        tgt_lang: string;
        description: string;
    };
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 2; // Maximum number of cached pipelines
const MODEL_LOAD_TIMEOUT = 60000; // 1 minute timeout for model loading

class PipelineManager {
    private static cache = new Map<string, PipelineCache>();
    private static cacheHits = 0;
    private static cacheMisses = 0;

    static async getTranslationPipeline(): Promise<TranslationPipeline> {
        const cacheKey = 'translation';
        return this.getPipeline(cacheKey, PipelineManager.createTranslationPipeline.bind(PipelineManager)) as Promise<TranslationPipeline>;
    }

    static async getGrammarPipeline(): Promise<GrammarPipeline> {
        const cacheKey = 'grammar';
        return this.getPipeline(cacheKey, PipelineManager.createGrammarPipeline.bind(PipelineManager)) as Promise<GrammarPipeline>;
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

        // Check if there was a recent error and avoid retrying too quickly
        if (cacheEntry?.error && (now - cacheEntry.lastUsed) < 60000) { // 1 minute cooldown
            throw new Error(`Recent error loading ${cacheKey} pipeline: ${cacheEntry.error}`);
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

        // Create new pipeline with timeout
        try {
            this.cache.set(cacheKey, { instance: null, lastUsed: now, loading: true });
            
            // Add timeout to prevent hanging
            const instance = await Promise.race([
                createPipeline(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error(`Model loading timeout after ${MODEL_LOAD_TIMEOUT/1000}s`)), MODEL_LOAD_TIMEOUT)
                )
            ]);
            
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.cache.set(cacheKey, { 
                instance: null, 
                lastUsed: now, 
                loading: false, 
                error: errorMessage 
            });
            console.error(`Failed to load ${cacheKey} pipeline:`, error);
            throw error;
        }
    }

    private static async createTranslationPipeline(): Promise<TranslationPipeline> {
        console.log('Loading translation pipeline...');
        
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            console.log('Running in browser environment');
        } else {
            console.log('Running in server environment');
        }

        // Try models that specifically support English to Nepali translation
        const models = [
            // {
            //     name: 'Xenova/opus-mt-en-hi',
            //     src_lang: 'en',
            //     tgt_lang: 'hi',
            //     description: 'Smallest, fastest option (~50MB) - English to Hindi (works for Nepali)'
            // },
            // {
            //     name: 'Xenova/marianmt-en-hi',
            //     src_lang: 'en',
            //     tgt_lang: 'hi',
            //     description: 'Medium size (~150MB) - English to Hindi (works for Nepali)'
            // },
            {
                name: 'Xenova/nllb-200-distilled-600M',
                src_lang: 'eng_Latn',
                tgt_lang: 'npi_Deva',
                description: 'Large but most accurate (~600MB) - Native Nepali support'
            },
            {
                name: 'Xenova/m2m100_418M',
                src_lang: 'en',
                tgt_lang: 'ne',
                description: 'Medium size (~400MB) - Direct English to Nepali'
            }
        ];
        
        let lastError: Error | null = null;
        
        for (const model of models) {
            try {
                console.log(`Attempting to load model: ${model.name}`);
                
                // Validate that this is a translation model
                if (!this.isTranslationModel(model.name)) {
                    console.warn(`Skipping ${model.name} - not a translation model`);
                    continue;
                }
                
                // Use dynamic import to avoid context issues
                const { pipeline: pipelineFn } = await import('@huggingface/transformers');
                
                console.log('Pipeline function type:', typeof pipelineFn);
                console.log('Pipeline function:', pipelineFn);
                
                // Use a simpler pipeline call with timeout
                const pipelineInstance = await Promise.race([
                    (pipelineFn as unknown as (task: string, model: string) => Promise<TranslationPipeline>)('translation', model.name),
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error(`Pipeline creation timeout for ${model.name}`)), 120000)
                    )
                ]);

                console.log(`Successfully loaded translation pipeline with model: ${model.name}`);
                console.log('Pipeline instance:', pipelineInstance);
                console.log('Pipeline type:', typeof pipelineInstance);
                
                // Store model information in cache
                const cacheEntry = this.cache.get('translation');
                if (cacheEntry) {
                    cacheEntry.modelInfo = {
                        name: model.name,
                        src_lang: model.src_lang,
                        tgt_lang: model.tgt_lang,
                        description: model.description
                    };
                }
                
                return pipelineInstance;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Failed to load model ${model.name}:`, errorMessage);
                console.error('Full error details:', error);
                lastError = error instanceof Error ? error : new Error(errorMessage);
                
                // If it's a memory error or timeout, try the next smaller model
                if (error instanceof Error && (
                    error.message.includes('memory') || 
                    error.message.includes('aborted') ||
                    error.message.includes('timeout') ||
                    error.message.includes('ENOMEM') ||
                    error.message.includes('out of memory')
                )) {
                    console.log(`Memory/timeout error with ${model.name}, trying next model...`);
                    continue;
                }
                
                // For other errors, also try the next model but log the specific error
                console.log(`Non-memory error with ${model.name}, trying next model...`);
                continue;
            }
        }
        
        throw new Error(`Failed to load any translation model. Last error: ${lastError?.message}`);
    }

    // Helper function to validate translation models
    private static isTranslationModel(modelName: string): boolean {
        const translationModelPatterns = [
            /opus-mt/i,
            /marianmt/i,
            /nllb/i,
            /m2m100/i,
            /mbart/i,
            /t5/i,
            /translation/i
        ];
        
        return translationModelPatterns.some(pattern => pattern.test(modelName));
    }

    private static async createGrammarPipeline(): Promise<GrammarPipeline> {
        console.log('Loading grammar pipeline...');
        
        try {
            const { pipeline: pipelineFn } = await import('@huggingface/transformers');
            const pipelineInstance = await (pipelineFn as unknown as (task: string, model: string) => Promise<GrammarPipeline>)('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');

            console.log('Grammar pipeline loaded successfully');
            return pipelineInstance;
        } catch (error) {
            console.error('Failed to load grammar pipeline:', error);
            throw new Error(`Grammar pipeline loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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

    static getCurrentModelInfo() {
        const cacheEntry = this.cache.get('translation');
        return cacheEntry?.modelInfo || null;
    }

    static clearCache(): void {
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        console.log('Cache cleared');
    }

    // Add method to clear error states
    static clearErrors(): void {
        for (const [key, entry] of this.cache.entries()) {
            if (entry.error) {
                this.cache.delete(key);
                console.log(`Cleared error state for: ${key}`);
            }
        }
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
