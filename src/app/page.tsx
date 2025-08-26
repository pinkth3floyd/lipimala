'use client';

import { useState, useEffect } from 'react';
import { TranslatorTransformer, TestTransformer } from "./actions";
import { translateText, translateText2 } from './actions/actions';

// Define the type for translation result
interface TranslationResult {
  translation_text: string;
  [key: string]: unknown;
}

export default function Home() {

  const data=' Record-Breaking Arrivals in April 2025 In April 2025, Nepal’s tourism sector celebrated a historic milestone with 116,490 foreign tourist arrivals—the highest monthly figure ever recorded for the country. This number marks a 106.5% increase compared to April 2019, the pre‑COVID benchmark, signaling a strong rebound for Nepal’s tourism post-pandemic Fiscal Nepal. From January to April, a total of 415,048 visitors arrived, reflecting steady growth and fueling optimism that tourism could soon contribute even more substantially to Nepal’s GDP, previously around 6%';





  // const [result, setResult] = useState<TranslationResult | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [loadingTime, setLoadingTime] = useState(0);

  // useEffect(() => {
  //   const loadTranslation = async () => {
  //     const startTime = Date.now();
  //     const timer = setInterval(() => {
  //       setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
  //     }, 1000);

  //     try {
  //       setLoading(true);
  //       setError(null);
  //       const translationResult = await TranslatorTransformer('Hello, how are you?');
  //       setResult(translationResult as TranslationResult);
  //     } catch (err) {
  //       console.error('Translation error:', err);
  //       const errorMessage = err instanceof Error ? err.message : 'Failed to load translation model';
  //       setError(errorMessage);
  //     } finally {
  //       setLoading(false);
  //       clearInterval(timer);
  //     }
  //   };

  //   loadTranslation();
  // }, []);


  // useEffect(() => {
  //   const res=async()=>{
  //     const res=await TestTransformer();
  //     console.log(res);
  //   }
  //   res();
  // }, []);

  useEffect(() => {
    const res=async()=>{
      const res=await translateText2(data, 'eng_Latn', 'hin_Deva');
      console.log(res);
    }
    res();
  }, []);


  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* {loading && (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading translation model...</h1>
          <p className="mb-2">This may take a few moments on first load.</p>
          <p className="text-sm text-gray-600">Time elapsed: {loadingTime} seconds</p>
          {loadingTime > 10 && (
            <p className="text-sm text-orange-600 mt-2">
              This is taking longer than usual. Please be patient...
            </p>
          )}
          {loadingTime > 30 && (
            <p className="text-sm text-red-600 mt-2">
              Loading timeout reached. Please refresh the page to try again.
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error loading translation model</h1>
          <p className="mb-4 text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
      
      {result && !loading && (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Translation Result:</h1>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-left whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )} */}
    </div>
  );
}
