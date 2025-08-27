'use client';

import { useState } from 'react';
import { translateText, correctGrammar, getCacheStats } from './actions/optimizedActions';

// Define the type for translation result
interface TranslationResult {
  translation_text?: string;
  [key: string]: unknown;
  fallback_used?: boolean;
  note?: string;
}

// Define the type for grammar correction result
interface GrammarCorrectionResult {
  status: 'Correct' | 'Incorrect';
  original: string;
  corrected_sentence?: string;
  suggestions?: Record<number, string[]>;
  confidence?: number;
}

// Define the type for cache statistics
interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'translation' | 'grammar'>('translation');
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [grammarResult, setGrammarResult] = useState<GrammarCorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStage, setLoadingStage] = useState<'idle' | 'loading_model' | 'translating'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setLoadingMessage('Loading translation model...');
    setLoadingStage('loading_model');
    setError(null);
    setTranslationResult(null);
    setGrammarResult(null);

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Update loading message after a delay to show model loading progress
        setTimeout(() => {
          if (loading && loadingStage === 'loading_model') {
            setLoadingMessage(retryCount > 0 
              ? `Retry ${retryCount}: Loading translation model...` 
              : 'Model loaded! Translating your text...'
            );
            setLoadingStage('translating');
          }
        }, 5000);

        // Add a timeout for the entire translation process
        const translationPromise = translateText(inputText, 'eng_Latn', 'npi_Deva');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Translation process timeout')), 60000)
        );

        const result = await Promise.race([translationPromise, timeoutPromise]);
        console.log('Translation result received:', result);
        setTranslationResult(result as TranslationResult);
        updateCacheStats();
        break; // Success, exit retry loop
      } catch (err) {
        console.error(`Translation error (attempt ${retryCount + 1}):`, err);
        retryCount++;
        
        if (retryCount > maxRetries) {
          // Final failure
          const errorMessage = err instanceof Error ? err.message : 'Failed to translate text. Please try again.';
          setError(errorMessage);
          break;
        } else {
          // Retry with delay
          setLoadingMessage(`Attempt ${retryCount} failed. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between retries
        }
      }
    }

    setLoading(false);
    setLoadingMessage('');
    setLoadingStage('idle');
  };

  const handleGrammarCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setLoadingMessage('Loading grammar correction model...');
    setLoadingStage('loading_model');
    setError(null);
    setTranslationResult(null);
    setGrammarResult(null);

    try {
      // Update loading message after a delay
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('Model loaded! Analyzing grammar...');
        }
      }, 3000);

      const result = await correctGrammar(inputText);
      // Type assertion to ensure the result matches our interface
      const typedResult: GrammarCorrectionResult = {
        status: result.status as 'Correct' | 'Incorrect',
        original: result.original,
        corrected_sentence: result.corrected_sentence,
        suggestions: result.suggestions,
        confidence: result.confidence
      };
      setGrammarResult(typedResult);
      updateCacheStats();
    } catch (err) {
      console.error('Grammar correction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to correct grammar. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (activeTab === 'translation') {
      handleTranslate(e);
    } else {
      handleGrammarCorrection(e);
    }
  };

  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Nepali Language Tools</h1>
        
        {/* Cache Stats */}
        {cacheStats && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg text-sm">
            <div className="text-gray-300 mb-2">Cache Performance:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Hit Rate: {(cacheStats.hitRate * 100).toFixed(1)}%</div>
              <div>Cache Size: {cacheStats.size}</div>
              <div>Hits: {cacheStats.hits}</div>
              <div>Misses: {cacheStats.misses}</div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('translation')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'translation'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Translation
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'grammar'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Grammar Correction
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inputText" className="block text-sm font-medium text-gray-300 mb-2">
              {activeTab === 'translation' 
                ? 'Enter text to translate (English to Nepali):'
                : 'Enter text for grammar correction:'
              }
            </label>
            <textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeTab === 'translation' 
                ? "Type your English text here..."
                : "Type your text here..."
              }
              className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-700 text-white"
              rows={4}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading 
              ? (activeTab === 'translation' ? 'Translating...' : 'Correcting...')
              : (activeTab === 'translation' ? 'Translate' : 'Correct Grammar')
            }
          </button>
        </form>

        {loading && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-300">{loadingMessage}</p>
            <p className="text-sm text-gray-400 mt-2">
              {loadingStage === 'loading_model' 
                ? 'Downloading and loading translation model... This may take a few minutes on first use.'
                : 'Translating your text...'
              }
            </p>
            {loadingStage === 'loading_model' && (
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: The model is being downloaded. This only happens once per session.
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-300 font-medium mb-2">Error:</p>
            <p className="text-red-300">{error}</p>
            {error.includes('timeout') && (
              <p className="text-red-200 text-sm mt-2">
                💡 Tip: Try again in a few moments, or use shorter text for faster processing.
              </p>
            )}
          </div>
        )}

        {/* Translation Result */}
        {translationResult && !loading && activeTab === 'translation' && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-white">Translation Result:</h2>
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              {translationResult.fallback_used && (
                <div className="mb-3 p-2 bg-yellow-900 border border-yellow-700 rounded text-yellow-200 text-sm">
                  ⚠️ Using fallback translation service. For better results, try again when models are available.
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-300">Translated Text: </span>
                  <span className="text-gray-200">{translationResult.translation_text}</span>
                </div>
                {translationResult.note && (
                  <div className="text-sm text-gray-400 italic">{translationResult.note}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
            <div>Debug Info:</div>
            <div>Loading: {loading.toString()}</div>
            <div>Loading Stage: {loadingStage}</div>
            <div>Active Tab: {activeTab}</div>
            <div>Translation Result: {translationResult ? 'Present' : 'None'}</div>
            <div>Error: {error || 'None'}</div>
            {translationResult && (
              <div>Result Keys: {Object.keys(translationResult).join(', ')}</div>
            )}
          </div>
        )}

        {/* Grammar Correction Result */}
        {grammarResult && !loading && activeTab === 'grammar' && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-white">Grammar Correction Result:</h2>
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-300">Status: </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    grammarResult.status === 'Correct' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {grammarResult.status}
                  </span>
                  {grammarResult.confidence && (
                    <span className="ml-2 text-sm text-gray-400">
                      (Confidence: {(grammarResult.confidence * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
                
                <div>
                  <span className="font-medium text-gray-300">Original: </span>
                  <span className="text-gray-200">{grammarResult.original}</span>
                </div>

                {grammarResult.status === 'Incorrect' && grammarResult.corrected_sentence && (
                  <div>
                    <span className="font-medium text-gray-300">Corrected: </span>
                    <span className="text-green-300">{grammarResult.corrected_sentence}</span>
                  </div>
                )}

                {grammarResult.suggestions && Object.keys(grammarResult.suggestions).length > 0 && (
                  <div>
                    <span className="font-medium text-gray-300">Suggestions: </span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(grammarResult.suggestions).map(([position, suggestions]) => (
                        <div key={position} className="text-sm">
                          <span className="text-gray-400">Position {position}: </span>
                          <span className="text-blue-300">{suggestions.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
