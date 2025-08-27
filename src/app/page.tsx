'use client';

import { useState } from 'react';
import { translateText, correctGrammar, getCacheStats } from './actions/optimizedActions';

// Define the type for translation result
interface TranslationResult {
  translation_text?: string;
  [key: string]: unknown;
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
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setLoadingMessage('Loading translation model...');
    setError(null);
    setTranslationResult(null);
    setGrammarResult(null);

    try {
      // Update loading message after a delay to show model loading progress
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('Model loaded! Translating your text...');
        }
      }, 5000);

      const result = await translateText(inputText, 'eng_Latn', 'npi_Deva');
      setTranslationResult(result as TranslationResult);
      updateCacheStats();
    } catch (err) {
      console.error('Translation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to translate text. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGrammarCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setLoadingMessage('Loading grammar correction model...');
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
              {activeTab === 'translation' 
                ? 'This may take a few moments on first use as the model loads...'
                : 'Analyzing your text...'
              }
            </p>
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
              <pre className="whitespace-pre-wrap text-gray-200">{JSON.stringify(translationResult, null, 2)}</pre>
            </div>
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
