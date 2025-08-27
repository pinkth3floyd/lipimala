import PipelineManager from "../core/config/optimizedConfig";

// Translation function with fallback
export async function translateText(text: string, sourceLang: string = 'eng_Latn', targetLang: string = 'npi_Deva') {
    try {
        console.log(`Translating: "${text}" from ${sourceLang} to ${targetLang}`);
        
        // Try to get cached pipeline first
        const pipeline = await PipelineManager.getTranslationPipeline();
        
        // Add timeout for the actual translation
        const result = await Promise.race([
            (pipeline as (text: string, options: { src_lang: string; tgt_lang: string }) => Promise<unknown>)(text, { src_lang: sourceLang, tgt_lang: targetLang }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Translation timeout after 30s')), 30000)
            )
        ]);
        
        console.log('Translation completed successfully');
        return result;
    } catch (error) {
        console.error('Translation failed:', error);
        
        // Fallback to basic translation or error message
        if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error('Translation timed out. The model is still loading or the text is too long. Please try again in a few moments.');
        }
        
        throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Grammar correction function
export async function correctGrammar(text: string) {
    try {
        console.log(`Correcting grammar for: "${text}"`);
        
        const pipeline = await PipelineManager.getGrammarPipeline();
        const sentimentResult = await (pipeline as (text: string) => Promise<Array<{ label?: string; score?: number }>>)(text);
        
        // Use sentiment analysis as a basic grammar indicator
        const isPotentiallyIncorrect = sentimentResult[0]?.label === 'NEGATIVE' || (sentimentResult[0]?.score ?? 0) > 0.8;
        
        if (!isPotentiallyIncorrect) {
            return {
                status: 'Correct',
                original: text,
                confidence: sentimentResult[0]?.score || 0
            };
        }

        // Apply basic grammar correction rules
        const correctedText = applyBasicGrammarRules(text);
        const tokens = text.split(' ');
        const suggestions = generateSuggestions(tokens);

        return {
            status: 'Incorrect',
            original: text,
            corrected_sentence: correctedText,
            suggestions,
            confidence: sentimentResult[0]?.score || 0
        };
    } catch (error) {
        console.error('Grammar correction failed:', error);
        // Fallback to basic rules
        return correctGrammarBasic(text);
    }
}

// Basic grammar correction without ML
function correctGrammarBasic(text: string) {
    const correctedText = applyBasicGrammarRules(text);
    const tokens = text.split(' ');
    const suggestions = generateSuggestions(tokens);
    const hasIssues = Object.keys(suggestions).length > 0 || text !== correctedText;

    return {
        status: hasIssues ? 'Incorrect' : 'Correct',
        original: text,
        corrected_sentence: correctedText,
        suggestions,
        confidence: 0.5
    };
}

// Basic grammar rules
function applyBasicGrammarRules(text: string): string {
    let corrected = text;

    // Capitalization rules
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

// Generate suggestions for potentially problematic words
function generateSuggestions(tokens: string[]): Record<number, string[]> {
    const suggestions: Record<number, string[]> = {};

    tokens.forEach((token, index) => {
        if (isPotentiallyIncorrectWord(token)) {
            suggestions[index] = generateWordSuggestions(token);
        }
    });

    return suggestions;
}

function isPotentiallyIncorrectWord(word: string): boolean {
    const issues = [
        /^[a-z]/, // Starts with lowercase
        /[A-Z]{2,}/, // Multiple uppercase letters
        /[0-9]/, // Contains numbers
        /^[^A-Za-z]/, // Starts with non-letter
        /[^A-Za-z]$/ // Ends with non-letter
    ];

    return issues.some(pattern => pattern.test(word));
}

function generateWordSuggestions(word: string): string[] {
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

// Cache management functions
export function getCacheStats() {
    return PipelineManager.getCacheStats();
}

export function clearCache() {
    PipelineManager.clearCache();
}
