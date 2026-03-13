
import React, { useState, useEffect } from 'react';
import { ResearchFormData, ResearchReport } from './types';
import { generateResearchReportStream, generateSectionIllustration, generateNarration } from './services/geminiService';
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
    setReport(null);

    try {
      // Step 1: Generate the primary text report with streaming
      const textReport = await generateResearchReportStream(data, (partial) => {
        setReport(prev => {
          if (!prev) {
            return {
              name: data.name,
              facts: data.facts || "None",
              geography: partial.geography || "",
              etymology: partial.etymology || "",
              geographicDistribution: partial.geographicDistribution || "",
              socialAnalysis: partial.socialAnalysis || "",
              variability: partial.variability || "",
              archives: partial.archives || [],
            };
          }
          return {
            ...prev,
            geography: partial.geography || prev.geography,
            etymology: partial.etymology || prev.etymology,
            geographicDistribution: partial.geographicDistribution || prev.geographicDistribution,
            socialAnalysis: partial.socialAnalysis || prev.socialAnalysis,
            variability: partial.variability || prev.variability,
            archives: partial.archives || prev.archives,
          };
        });
      });

      // Step 2: Kick off image generation processes in parallel
      const name = data.name;

      generateSectionIllustration(name, 'header', textReport.etymology).then(url => {
        setReport(prev => prev ? { ...prev, headerImageUrl: url } : null);
      }).catch(console.error);

      generateSectionIllustration(name, 'etymology', textReport.etymology).then(url => {
        setReport(prev => prev ? { ...prev, etymologyImageUrl: url } : null);
      }).catch(console.error);

      generateSectionIllustration(name, 'geography', textReport.geographicDistribution).then(url => {
        setReport(prev => prev ? { ...prev, geoImageUrl: url } : null);
      }).catch(console.error);

      generateSectionIllustration(name, 'social', textReport.socialAnalysis).then(url => {
        setReport(prev => prev ? { ...prev, socialImageUrl: url } : null);
      }).catch(console.error);

      generateSectionIllustration(name, 'variability', textReport.variability).then(url => {
        setReport(prev => prev ? { ...prev, variabilityImageUrl: url } : null);
      }).catch(console.error);

      // Step 3: Sequential Narration Generation in the background
      const generateAllNarrations = async () => {
        try {
          const etymologyAudio = await generateNarration(textReport.etymology);
          setReport(prev => prev ? { ...prev, etymologyAudioUrl: etymologyAudio } : null);

          const geoAudio = await generateNarration(textReport.geographicDistribution);
          setReport(prev => prev ? { ...prev, geoAudioUrl: geoAudio } : null);

          const socialAudio = await generateNarration(textReport.socialAnalysis);
          setReport(prev => prev ? { ...prev, socialAudioUrl: socialAudio } : null);

          const variabilityAudio = await generateNarration(textReport.variability);
          setReport(prev => prev ? { ...prev, variabilityAudioUrl: variabilityAudio } : null);
        } catch (err) {
          console.error("Narration generation failed:", err);
        }
      };

      generateAllNarrations();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Archive access failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-amber-100 selection:text-amber-900 bg-stone-50 relative overflow-hidden">
      {!report && (
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

        {isLoading && !report && (
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

        {report && (
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
