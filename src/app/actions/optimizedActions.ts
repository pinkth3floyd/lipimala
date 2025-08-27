import PipelineManager from "../core/config/optimizedConfig";

// Simple fallback translation dictionary for common phrases
const fallbackTranslations: Record<string, string> = {
    'hello': 'नमस्ते',
    'goodbye': 'अलविदा',
    'thank you': 'धन्यवाद',
    'please': 'कृपया',
    'yes': 'हो',
    'no': 'होइन',
    'water': 'पानी',
    'food': 'खाना',
    'house': 'घर',
    'car': 'कार',
    'book': 'किताब',
    'computer': 'कम्प्युटर',
    'phone': 'फोन',
    'money': 'पैसा',
    'work': 'काम',
    'family': 'परिवार',
    'friend': 'साथी',
    'time': 'समय',
    'day': 'दिन',
    'night': 'रात',
    'good': 'राम्रो',
    'bad': 'नराम्रो',
    'big': 'ठूलो',
    'small': 'सानो',
    'hot': 'तातो',
    'cold': 'चिसो',
    'new': 'नयाँ',
    'old': 'पुरानो',
    'beautiful': 'सुन्दर',
    'ugly': 'कुरूप',
    'happy': 'खुशी',
    'sad': 'दुखी',
    'angry': 'रिसाउने',
    'tired': 'थकित',
    'hungry': 'भोको',
    'thirsty': 'तिर्खा',
    'sleepy': 'निद्रालो',
    'sick': 'बिरामी',
    'healthy': 'स्वस्थ',
    'strong': 'बलियो',
    'weak': 'कमजोर',
    'fast': 'छिटो',
    'slow': 'बिस्तारै',
    'easy': 'सजिलो',
    'difficult': 'गाह्रो',
    'important': 'महत्वपूर्ण',
    'necessary': 'आवश्यक',
    'possible': 'सम्भव',
    'impossible': 'असम्भव',
    'right': 'सही',
    'wrong': 'गलत',
    'true': 'सत्य',
    'false': 'असत्य',
    'open': 'खुला',
    'closed': 'बन्द',
    'clean': 'सफा',
    'dirty': 'फोहोर',
    'full': 'भरिएको',
    'empty': 'खाली',
    'rich': 'धनी',
    'poor': 'गरीब',
    'young': 'जवान',
    'elderly': 'बुढो',
    'man': 'पुरुष',
    'woman': 'महिला',
    'child': 'बच्चा',
    'boy': 'केटा',
    'girl': 'केटी',
    'father': 'बुबा',
    'mother': 'आमा',
    'son': 'छोरा',
    'daughter': 'छोरी',
    'brother': 'दाजु',
    'sister': 'दिदी',
    'teacher': 'शिक्षक',
    'student': 'विद्यार्थी',
    'doctor': 'डाक्टर',
    'engineer': 'इन्जिनियर',
    'business': 'व्यवसाय',
    'school': 'स्कूल',
    'hospital': 'अस्पताल',
    'market': 'बजार',
    'office': 'कार्यालय',
    'bank': 'बैंक',
    'hotel': 'होटल',
    'restaurant': 'रेस्टुरेन्ट',
    'shop': 'पसल',
    'road': 'सडक',
    'bridge': 'पुल',
    'mountain': 'पहाड',
    'river': 'नदी',
    'lake': 'ताल',
    'forest': 'जंगल',
    'city': 'शहर',
    'village': 'गाउँ',
    'country': 'देश',
    'world': 'संसार',
    'sun': 'सूर्य',
    'moon': 'चन्द्रमा',
    'star': 'तारा',
    'cloud': 'बादल',
    'rain': 'पानी',
    'snow': 'हिउँ',
    'wind': 'हावा',
    'fire': 'आगो',
    'earth': 'पृथ्वी',
    'air': 'हावा',
    'light': 'उज्यालो',
    'dark': 'अँध्यारो',
    'color': 'रङ',
    'red': 'रातो',
    'blue': 'नीलो',
    'green': 'हरियो',
    'yellow': 'पहेंलो',
    'black': 'कालो',
    'white': 'सेतो',
    'brown': 'खैरो',
    'orange': 'सुन्तला',
    'purple': 'बैजनी',
    'pink': 'गुलाफी',
    'gray': 'खरानी',
    'number': 'संख्या',
    'one': 'एक',
    'two': 'दुई',
    'three': 'तीन',
    'four': 'चार',
    'five': 'पाँच',
    'six': 'छ',
    'seven': 'सात',
    'eight': 'आठ',
    'nine': 'नौ',
    'ten': 'दस',
    'hundred': 'सय',
    'thousand': 'हजार',
    'million': 'लाख',
    'first': 'पहिलो',
    'second': 'दोस्रो',
    'third': 'तेस्रो',
    'last': 'अन्तिम',
    'next': 'अर्को',
    'previous': 'अघिल्लो',
    'today': 'आज',
    'yesterday': 'हिजो',
    'tomorrow': 'भोलि',
    'morning': 'बिहान',
    'afternoon': 'दिउँसो',
    'evening': 'साँझ',
    'nighttime': 'रात',
    'week': 'हप्ता',
    'month': 'महिना',
    'year': 'वर्ष',
    'spring': 'बसन्त',
    'summer': 'ग्रीष्म',
    'autumn': 'शरद',
    'winter': 'शिशिर',
    'monday': 'सोमबार',
    'tuesday': 'मंगलबार',
    'wednesday': 'बुधबार',
    'thursday': 'बिहिबार',
    'friday': 'शुक्रबार',
    'saturday': 'शनिबार',
    'sunday': 'आइतबार',
    'january': 'जनवरी',
    'february': 'फेब्रुअरी',
    'march': 'मार्च',
    'april': 'अप्रिल',
    'may': 'मे',
    'june': 'जुन',
    'july': 'जुलाई',
    'august': 'अगस्त',
    'september': 'सेप्टेम्बर',
    'october': 'अक्टोबर',
    'november': 'नोभेम्बर',
    'december': 'डिसेम्बर'
};

// Fallback translation function
function fallbackTranslate(text: string): string {
    const words = text.toLowerCase().split(/\s+/);
    const translatedWords = words.map(word => {
        // Remove punctuation for lookup
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        return fallbackTranslations[cleanWord] || word;
    });
    return translatedWords.join(' ');
}

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
        console.log('Raw translation result:', result);
        
        // Format the result for the UI
        let formattedResult;
        if (typeof result === 'string') {
            formattedResult = {
                translation_text: result,
                fallback_used: false
            };
        } else if (result && typeof result === 'object') {
            // Handle different result formats
            if ('translation_text' in result) {
                formattedResult = {
                    translation_text: result.translation_text,
                    fallback_used: false
                };
            } else if ('text' in result) {
                formattedResult = {
                    translation_text: result.text,
                    fallback_used: false
                };
            } else {
                // Try to find any text property
                const textValue = Object.values(result).find(val => typeof val === 'string');
                formattedResult = {
                    translation_text: textValue || JSON.stringify(result),
                    fallback_used: false
                };
            }
        } else {
            formattedResult = {
                translation_text: String(result),
                fallback_used: false
            };
        }
        
        console.log('Formatted result:', formattedResult);
        return formattedResult;
    } catch (error) {
        console.error('Translation failed:', error);
        
        // Clear error states to allow retry with different models
        PipelineManager.clearErrors();
        
        // Provide specific error messages based on error type
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                throw new Error('Translation timed out. The model is still loading or the text is too long. Please try again in a few moments.');
            }
            
            if (error.message.includes('memory') || error.message.includes('ENOMEM')) {
                throw new Error('Translation failed due to memory constraints. Please try with shorter text or try again later.');
            }
            
            if (error.message.includes('Failed to load any translation model')) {
                // Use fallback translation
                console.log('Using fallback translation service');
                const fallbackResult = fallbackTranslate(text);
                return {
                    translation_text: fallbackResult,
                    fallback_used: true,
                    note: 'Translation models unavailable. Using basic dictionary translation.'
                };
            }
            
            if (error.message.includes('Recent error')) {
                throw new Error('Translation service is temporarily unavailable. Please wait a moment and try again.');
            }
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
        
        // Clear error states
        PipelineManager.clearErrors();
        
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
