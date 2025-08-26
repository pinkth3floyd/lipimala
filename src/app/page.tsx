'use client';

import { useState } from 'react';
import { translateText2 } from './actions/actions';

// Define the type for translation result
interface TranslationResult {
  translation_text?: string;
  [key: string]: unknown;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const translationResult = await translateText2(inputText, 'eng_Latn', 'npi_Deva');
      setResult(translationResult as TranslationResult);
    } catch (err) {
      console.error('Translation error:', err);
      setError('Failed to translate text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Text Translator</h1>
        
        <form onSubmit={handleTranslate} className="space-y-4">
          <div>
            <label htmlFor="inputText" className="block text-sm font-medium text-gray-700 mb-2 text-white">
              Enter text to translate (English to Hindi):
            </label>
            <textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your text here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </form>

        {loading && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">Translating your text...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Translation Result:</h2>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <pre className="whitespace-pre-wrap text-gray-800">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
