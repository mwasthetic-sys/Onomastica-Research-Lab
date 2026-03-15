
import React, { useState, useEffect } from 'react';
import { ResearchFormData, ResearchReport } from './types';
import { generateSectionChunks, generateSectionText, generateArchives, generateSectionIllustration, generateNarration, generateOrigin } from './services/geminiService';
import ResearchForm from './components/ResearchForm';
import ReportDisplay from './components/ReportDisplay';
import NameCarousel from './components/NameCarousel';

const App: React.FC = () => {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<{value: string, timestamp: number} | null>(null);

  const handleResearch = async (data: ResearchFormData) => {
    setIsLoading(true);
    setError(null);
    
    // Initialize empty report to show the UI immediately
    setReport({
      name: data.name,
      facts: data.facts || "None",
      geography: data.geography || "Analyzing...",
      etymology: [],
      geographicDistribution: [],
      socialAnalysis: [],
      variability: [],
      archives: [],
      etymologyAudioUrls: [],
      geoAudioUrls: [],
      socialAudioUrls: [],
      variabilityAudioUrls: [],
    });
    
    // We can stop the global loading spinner since the report UI will handle the progressive loading
    setIsLoading(false);

    try {
      let currentReport: Partial<ResearchReport> = {};
      let context = "";
      let audioQueue = Promise.resolve();
      
      const updateReport = (updates: Partial<ResearchReport>) => {
        currentReport = { ...currentReport, ...updates };
        setReport(prev => prev ? { ...prev, ...updates } : null);
      };

      // Fire off the origin generation in the background immediately so it doesn't block
      if (!data.geography) {
        generateOrigin(data, "").then(origin => updateReport({ geography: origin })).catch(console.error);
      }

      // Fire off the first image immediately so it's ready
      generateSectionIllustration(data.name, 'etymology').then(img => updateReport({ etymologyImageUrl: img })).catch(console.error);

      // Queue the rest of the images to avoid hitting the browser's 6-connection limit
      // which was blocking the TTS audio requests from firing
      let imageQueue = Promise.resolve();
      const queueImage = (section: string, key: string) => {
        imageQueue = imageQueue.then(async () => {
          try {
            const img = await generateSectionIllustration(data.name, section);
            updateReport({ [key]: img });
          } catch (e) {
            console.error(`Failed to generate image for ${section}`, e);
          }
        });
      };

      queueImage('geography', 'geoImageUrl');
      queueImage('social', 'socialImageUrl');
      queueImage('variability', 'variabilityImageUrl');
      queueImage('header', 'headerImageUrl');

      // Helper for streaming section (Section 1)
      const processSectionStreaming = async (
        sectionName: string, 
        textKey: 'etymology',
        audioKey: 'etymologyAudioUrls',
        completeKey: 'etymologyComplete',
        contextLabel: string
      ) => {
        const textArray: string[] = [];
        const audioArray: string[] = [];
        
        const fullText = await generateSectionChunks(data, sectionName, context, (sentence, index) => {
          textArray[index] = sentence;
          updateReport({ [textKey]: [...textArray] });
          
          audioQueue = audioQueue.then(async () => {
            try {
              const audioUrl = await generateNarration(sentence);
              audioArray[index] = audioUrl;
              updateReport({ [audioKey]: [...audioArray] });
            } catch (e) {
              console.error(`Narration failed for ${textKey} sentence`, index, e);
              audioArray[index] = "FAILED";
              updateReport({ [audioKey]: [...audioArray] });
            }
          });
        });
        
        updateReport({ [completeKey]: true });
        context += `\n${contextLabel}: ${fullText}`;
          
        return fullText;
      };

      // Helper for batch section (Sections 2-4)
      const processSectionBatch = async (
        sectionName: string, 
        textKey: 'geographicDistribution' | 'socialAnalysis' | 'variability',
        audioKey: 'geoAudioUrls' | 'socialAudioUrls' | 'variabilityAudioUrls',
        completeKey: 'geoComplete' | 'socialComplete' | 'variabilityComplete',
        contextLabel: string
      ) => {
        const fullText = await generateSectionText(data, sectionName, context);
        updateReport({ [textKey]: [fullText] });
        
        audioQueue = audioQueue.then(async () => {
          try {
            const audioUrl = await generateNarration(fullText);
            updateReport({ [audioKey]: [audioUrl] });
          } catch (e) {
            console.error(`Narration failed for ${textKey}`, e);
            updateReport({ [audioKey]: ["FAILED"] });
          }
        });
        
        updateReport({ [completeKey]: true });
        context += `\n${contextLabel}: ${fullText}`;
          
        return fullText;
      };

      // 1. Etymology (Streaming)
      const etyText = await processSectionStreaming(
        "Etymology (linguistic roots and origins)", 
        'etymology', 
        'etymologyAudioUrls', 
        'etymologyComplete',
        'Etymology'
      );

      // 2. Geography (Batch)
      const geoText = await processSectionBatch(
        "Geographic Distribution (historical hubs prior to 20th century)", 
        'geographicDistribution', 
        'geoAudioUrls', 
        'geoComplete',
        'Geography'
      );

      // 3. Social (Batch)
      const socText = await processSectionBatch(
        "Social Analysis (social classes or groups)", 
        'socialAnalysis', 
        'socialAudioUrls', 
        'socialComplete',
        'Social'
      );

      // 4. Variability (Batch)
      const varText = await processSectionBatch(
        "Variability (phonetic distortions and spelling variations)", 
        'variability', 
        'variabilityAudioUrls', 
        'variabilityComplete',
        'Variability'
      );

      // 5. Archives
      const archives = await generateArchives(data, context);
      updateReport({ archives });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Archive access failed. Please try again.");
    }
  };

  const isNarrationReady = !!(report && report.etymologyAudioUrls && report.etymologyAudioUrls.length > 0);

  return (
    <div className="min-h-screen pb-20 selection:bg-amber-100 selection:text-amber-900 bg-stone-50 relative overflow-hidden">
      {(!report || !isNarrationReady) && (
        <div className="fixed inset-0 z-0 pointer-events-auto overflow-hidden flex flex-col justify-center">
          <NameCarousel onNameClick={isLoading ? undefined : (name) => {
            setSelectedName({ value: name, timestamp: Date.now() });
            // Scroll to form smoothly
            document.getElementById('research-form-section')?.scrollIntoView({ behavior: 'smooth' });
          }} />
        </div>
      )}

      <header className="bg-stone-900 text-stone-100 py-16 px-4 shadow-xl print:hidden relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-amber-600 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="serif text-5xl md:text-6xl font-bold mb-4 tracking-tight">Onomastica Research Lab</h1>
          <p className="max-w-2xl text-stone-400 text-lg font-light leading-relaxed">
            Advanced etymological intelligence and genealogical visualization.
          </p>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 -mt-8 z-20 pointer-events-none">
        {!report && !isLoading && (
          <div id="research-form-section" className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-stone-100 relative z-10 pointer-events-auto">
            <div className="mb-8 text-center">
              <h2 className="serif text-3xl font-bold text-stone-800 mb-2">Initiate Archival Search</h2>
              <p className="text-stone-500">Enter lineage parameters to begin deep research.</p>
            </div>
            <ResearchForm onSubmit={handleResearch} isLoading={isLoading} selectedName={selectedName} />
          </div>
        )}

        {((isLoading && !report) || (report && !isNarrationReady)) && (
          <div className="max-w-2xl mx-auto text-center py-20 space-y-6 pointer-events-auto">
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100 border-t-amber-800 animate-spin"></div>
              <div className="absolute inset-4 rounded-full border-2 border-stone-200 border-b-stone-400 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <h3 className="serif text-2xl font-bold text-stone-800">Analyzing Centuries of Data...</h3>
              <p className="text-stone-500 italic">Connecting linguistic roots with geographic hubs...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center shadow-lg pointer-events-auto">
            <p className="font-bold text-lg mb-1">Search Interrupted</p>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset Research Console
            </button>
          </div>
        )}

        {isNarrationReady && report && (
          <div className="pb-20 pointer-events-auto">
            <ReportDisplay report={report} />
            <div className="no-print mt-12 text-center">
              <button 
                onClick={() => setReport(null)}
                className="px-8 py-3 bg-stone-200 text-stone-700 rounded-xl font-semibold hover:bg-stone-300 transition-colors"
              >
                ← Clear Report & Research New Name
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
