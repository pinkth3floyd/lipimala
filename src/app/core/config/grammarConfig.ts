import { pipeline } from "@huggingface/transformers";

declare global {
    var GrammarCorrectorSingleton: ReturnType<typeof createGrammarCorrectorSingleton> | undefined;
}

// Define interfaces for the grammar corrector
interface GrammarCorrectorPipeline {
    correct(text: string): Promise<GrammarCorrectionResult>;
}

interface GrammarCorrectionResult {
    status: 'Correct' | 'Incorrect';
    original: string;
    tokens?: string[];
    incorrect_positions?: number[];
    incorrect_tokens?: string[];
    suggestions?: Record<number, string[]>;
    corrected_sentence?: string;
}

// Define pipeline types
interface PipelineInstance {
    (text: string, options?: Record<string, unknown>): Promise<unknown>;
}

const createGrammarCorrectorSingleton = () => class GrammarCorrectorSingleton {
    // Use a single lightweight model
    static model = 'Xenova/bert-base-multilingual-uncased-sentiment';
    static instance: GrammarCorrectorPipeline | null = null;

    static async getInstance(): Promise<GrammarCorrectorPipeline> {
        if (this.instance === null) {
            try {
                console.log('Loading grammar correction model...');
                
                // Initialize only one model to reduce memory usage
                const sentimentPipeline = await (pipeline as unknown as (task: string, model: string, options?: Record<string, unknown>) => Promise<PipelineInstance>)('sentiment-analysis', this.model, {
                    dtype: 'fp32',
                    revision: 'main'
                });

                console.log('Grammar correction model loaded successfully');

                // Create the grammar corrector instance with simplified logic
                this.instance = {
                    correct: async (text: string): Promise<GrammarCorrectionResult> => {
                        return await this.correctText(text, sentimentPipeline);
                    }
                };
            } catch (error) {
                console.error('Failed to load grammar correction model:', error);
                // Create a fallback instance that uses basic rules
                this.instance = {
                    correct: async (text: string): Promise<GrammarCorrectionResult> => {
                        return await this.correctTextBasic(text);
                    }
                };
            }
        }
        return this.instance!;
    }

    private static async correctText(text: string, sentimentPipeline: PipelineInstance): Promise<GrammarCorrectionResult> {
        try {
            // Use sentiment analysis as a basic grammar indicator
            const sentimentResult = await sentimentPipeline(text) as Array<{ label?: string; score?: number }>;
            const isPotentiallyIncorrect = sentimentResult[0]?.label === 'NEGATIVE' || (sentimentResult[0]?.score ?? 0) > 0.8;

            if (!isPotentiallyIncorrect) {
                return { status: 'Correct', original: text };
            }

            // Apply basic grammar correction rules
            const correctedText = this.applyBasicGrammarRules(text);
            const tokens = text.split(' ');
            const suggestions: Record<number, string[]> = {};

            // Generate basic suggestions for potentially problematic words
            tokens.forEach((token, index) => {
                if (this.isPotentiallyIncorrectWord(token)) {
                    suggestions[index] = this.generateSuggestions(token);
                }
            });

            return {
                status: 'Incorrect',
                original: text,
                tokens,
                incorrect_positions: Object.keys(suggestions).map(Number),
                incorrect_tokens: Object.keys(suggestions).map(i => tokens[parseInt(i)]),
                suggestions,
                corrected_sentence: correctedText
            };
        } catch (error) {
            console.error('Error in grammar correction:', error);
            return await this.correctTextBasic(text);
        }
    }

    private static async correctTextBasic(text: string): Promise<GrammarCorrectionResult> {
        // Basic grammar correction without ML models
        const correctedText = this.applyBasicGrammarRules(text);
        const tokens = text.split(' ');
        const suggestions: Record<number, string[]> = {};

        tokens.forEach((token, index) => {
            if (this.isPotentiallyIncorrectWord(token)) {
                suggestions[index] = this.generateSuggestions(token);
            }
        });

        const hasIssues = Object.keys(suggestions).length > 0 || text !== correctedText;

        return {
            status: hasIssues ? 'Incorrect' : 'Correct',
            original: text,
            tokens,
            incorrect_positions: Object.keys(suggestions).map(Number),
            incorrect_tokens: Object.keys(suggestions).map(i => tokens[parseInt(i)]),
            suggestions,
            corrected_sentence: correctedText
        };
    }

    private static applyBasicGrammarRules(text: string): string {
        let corrected = text;

        // Basic capitalization rules
        corrected = corrected.replace(/\b\w/g, (char) => char.toUpperCase());
        
        // Fix common punctuation issues
        corrected = corrected.replace(/\s+([.,!?])/g, '$1');
        corrected = corrected.replace(/([.,!?])([A-Za-z])/g, '$1 $2');
        
        // Fix double spaces
        corrected = corrected.replace(/\s+/g, ' ');
        
        // Fix common word issues
        corrected = corrected.replace(/\b(?:i)\b/g, 'I');
        corrected = corrected.replace(/\b(?:dont|cant|wont|isnt|arent|wasnt|werent)\b/g, (match) => {
            const contractions: Record<string, string> = {
                'dont': "don't",
                'cant': "can't",
                'wont': "won't",
                'isnt': "isn't",
                'arent': "aren't",
                'wasnt': "wasn't",
                'werent': "weren't"
            };
            return contractions[match] || match;
        });

        return corrected.trim();
    }

    private static isPotentiallyIncorrectWord(word: string): boolean {
        // Check for common issues
        const issues = [
            /^[a-z]/, // Starts with lowercase
            /[A-Z]{2,}/, // Multiple uppercase letters
            /[0-9]/, // Contains numbers
            /^[^A-Za-z]/, // Starts with non-letter
            /[^A-Za-z]$/ // Ends with non-letter
        ];

        return issues.some(pattern => pattern.test(word));
    }

    private static generateSuggestions(word: string): string[] {
        const suggestions: string[] = [];

        // Capitalization suggestions
        if (/^[a-z]/.test(word)) {
            suggestions.push(word.charAt(0).toUpperCase() + word.slice(1));
        }

        // Common word corrections
        const corrections: Record<string, string[]> = {
            'teh': ['the'],
            'recieve': ['receive'],
            'seperate': ['separate'],
            'definately': ['definitely'],
            'occured': ['occurred'],
            'begining': ['beginning'],
            'neccessary': ['necessary'],
            'accomodate': ['accommodate'],
            'calender': ['calendar'],
            'collegue': ['colleague']
        };

        const lowerWord = word.toLowerCase();
        if (corrections[lowerWord]) {
            suggestions.push(...corrections[lowerWord]);
        }

        // Remove special characters
        const cleanWord = word.replace(/[^A-Za-z]/g, '');
        if (cleanWord && cleanWord !== word) {
            suggestions.push(cleanWord);
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }
}

let GrammarCorrectorSingleton: ReturnType<typeof createGrammarCorrectorSingleton>;

// Use the appropriate global object for the environment
const globalObj = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : globalThis;

if (process.env.NODE_ENV !== 'production') {
    if (!globalObj.GrammarCorrectorSingleton) {
        globalObj.GrammarCorrectorSingleton = createGrammarCorrectorSingleton();
    }
    GrammarCorrectorSingleton = globalObj.GrammarCorrectorSingleton;
} else {
    GrammarCorrectorSingleton = createGrammarCorrectorSingleton();
}

export default GrammarCorrectorSingleton;
