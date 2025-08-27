'use client';

import { useState } from 'react';
import { translateText, correctGrammar, getCacheStats } from './actions/optimizedActions';

// Define the type for translation result
interface TranslationResult {
  translation_text?: string;
  fallback_used?: boolean;
  model_used?: string;
  note?: string;
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
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Nepali Language Tools
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Cache Stats */}
          {cacheStats && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Cache Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-blue-400 font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
                  <div className="text-gray-400">Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-medium">{cacheStats.size}</div>
                  <div className="text-gray-400">Cache Size</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-medium">{cacheStats.hits}</div>
                  <div className="text-gray-400">Hits</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-medium">{cacheStats.misses}</div>
                  <div className="text-gray-400">Misses</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('translation')}
                className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${
                  activeTab === 'translation'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Translation
              </button>
              <button
                onClick={() => setActiveTab('grammar')}
                className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${
                  activeTab === 'grammar'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Grammar Correction
              </button>
            </div>
          </div>
          
          {/* Input Form */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="inputText" className="block text-sm font-medium text-gray-300 mb-3">
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
                  className="w-full p-4 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-700 text-white placeholder-gray-400 min-h-[120px]"
                  rows={4}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl"
              >
                {loading 
                  ? (activeTab === 'translation' ? 'Translating...' : 'Correcting...')
                  : (activeTab === 'translation' ? 'Translate' : 'Correct Grammar')
                }
              </button>
            </form>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg mb-2">{loadingMessage}</p>
              <p className="text-sm text-gray-400">
                {loadingStage === 'loading_model' 
                  ? 'Downloading and loading translation model... This may take a few minutes on first use.'
                  : 'Translating your text...'
                }
              </p>
              {loadingStage === 'loading_model' && (
                <div className="mt-4 text-xs text-gray-500 bg-gray-700 rounded p-3">
                  💡 Tip: The model is being downloaded. This only happens once per session.
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-300 mb-2">Error</h3>
                  <p className="text-red-300">{error}</p>
                  {error.includes('timeout') && (
                    <p className="text-red-200 text-sm mt-3">
                      💡 Tip: Try again in a few moments, or use shorter text for faster processing.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Translation Result */}
          {translationResult && !loading && activeTab === 'translation' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <svg className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Translation Result
              </h2>
              <div className="space-y-4">
                {translationResult.fallback_used && (
                  <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-200 font-medium">Using fallback translation service</span>
                    </div>
                    <p className="text-yellow-100 text-sm mt-2">For better results, try again when models are available.</p>
                  </div>
                )}
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-300">Translated Text:</span>
                      <div className="mt-2 p-3 bg-gray-600 rounded border-l-4 border-blue-500">
                        <span className="text-white text-lg">{translationResult.translation_text}</span>
                      </div>
                    </div>
                    
                    {translationResult.model_used && !translationResult.fallback_used && (
                      <div className="flex items-center text-sm text-blue-300">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Model used: {translationResult.model_used}
                      </div>
                    )}
                    
                    {translationResult.note && (
                      <div className="text-sm text-gray-400 italic bg-gray-600 rounded p-3">
                        {translationResult.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grammar Correction Result */}
          {grammarResult && !loading && activeTab === 'grammar' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <svg className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Grammar Correction Result
              </h2>
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    grammarResult.status === 'Correct' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {grammarResult.status}
                  </span>
                </div>
                
                {grammarResult.confidence && (
                  <div className="text-sm text-gray-400">
                    Confidence: {(grammarResult.confidence * 100).toFixed(1)}%
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-300">Original:</span>
                  <div className="mt-2 p-3 bg-gray-600 rounded">
                    <span className="text-white">{grammarResult.original}</span>
                  </div>
                </div>

                {grammarResult.status === 'Incorrect' && grammarResult.corrected_sentence && (
                  <div>
                    <span className="font-medium text-gray-300">Corrected:</span>
                    <div className="mt-2 p-3 bg-green-900 border border-green-700 rounded">
                      <span className="text-green-200">{grammarResult.corrected_sentence}</span>
                    </div>
                  </div>
                )}

                {grammarResult.suggestions && Object.keys(grammarResult.suggestions).length > 0 && (
                  <div>
                    <span className="font-medium text-gray-300">Suggestions:</span>
                    <div className="mt-2 space-y-2">
                      {Object.entries(grammarResult.suggestions).map(([position, suggestions]) => (
                        <div key={position} className="text-sm bg-gray-600 rounded p-2">
                          <span className="text-gray-400">Position {position}: </span>
                          <span className="text-blue-300">{suggestions.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Debug Info</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Loading:</div>
                  <div className="text-white">{loading.toString()}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Stage:</div>
                  <div className="text-white">{loadingStage}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Tab:</div>
                  <div className="text-white">{activeTab}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Result:</div>
                  <div className="text-white">{translationResult ? 'Present' : 'None'}</div>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <div className="text-gray-400">Error:</div>
                  <div className="text-white">{error || 'None'}</div>
                </div>
                {translationResult && (
                  <div className="bg-gray-700 rounded p-2 col-span-2 sm:col-span-1">
                    <div className="text-gray-400">Keys:</div>
                    <div className="text-white">{Object.keys(translationResult).join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
