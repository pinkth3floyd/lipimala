import { pipeline } from "@huggingface/transformers";

declare global {
    var PipelineSingleton: ReturnType<typeof createPipelineSingleton> | undefined;
}

// Define a simple interface that matches what we actually use
interface TranslationPipeline {
    (text: string, options?: { src_lang?: string; tgt_lang?: string }): Promise<unknown>;
}

const createPipelineSingleton = () => class PipelineSingleton {
    static task = 'sentiment-analysis';
    // Use a much smaller model that's more browser-friendly
    static model = 'Xenova/bert-base-multilingual-uncased-sentiment';
    static instance: TranslationPipeline | null = null;

    static async getInstance(progress_callback?: (progress: { status: string; loaded?: number; total?: number }) => void): Promise<TranslationPipeline> {
        if (this.instance === null) {
            try {
                // Add timeout to prevent hanging
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Model loading timeout')), 120000); // 2 minute timeout for large model
                });

                const pipelinePromise = (pipeline as unknown as (task: string, model: string, options?: unknown) => Promise<TranslationPipeline>)(this.task, this.model, { 
                    progress_callback,
                    dtype: 'fp32',
                    revision: 'main',
                    quantized: true // Use quantized model for smaller size
                });

                // Race between timeout and pipeline loading
                this.instance = await Promise.race([pipelinePromise, timeoutPromise]);
            } catch (error) {
                console.error('Failed to load translation model:', error);
                throw new Error(`Failed to initialize translation pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return this.instance!;
    }
}

let PipelineSingleton: ReturnType<typeof createPipelineSingleton>;

// Use the appropriate global object for the environment
const globalObj = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : globalThis;

if (process.env.NODE_ENV !== 'production') {
    if (!globalObj.PipelineSingleton) {
        globalObj.PipelineSingleton = createPipelineSingleton();
    }
    PipelineSingleton = globalObj.PipelineSingleton;
} else {
    PipelineSingleton = createPipelineSingleton();
}

export default PipelineSingleton;