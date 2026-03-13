
import React, { useState, useEffect, useRef } from 'react';
import { ResearchReport } from '../types';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, Volume2, VolumeX, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import LiveAssistant from './LiveAssistant';

interface Props {
  report: ResearchReport;
}

type SectionKey = 'etymology' | 'geography' | 'social' | 'variability';

const ReportDisplay: React.FC<Props> = ({ report }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [fullscreenTab, setFullscreenTab] = useState<SectionKey | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sections: SectionKey[] = ['etymology', 'geography', 'social', 'variability'];

  const handleDownload = async () => {
    const reportElement = document.getElementById('research-report');
    if (!reportElement) return;

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(reportElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8f5f2',
        scale: 2,
        logging: false,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Onomastica_Report_${report.name.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      window.print();
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenTab) return;
      if (e.key === 'ArrowRight') navigateFullscreen('next');
      if (e.key === 'ArrowLeft') navigateFullscreen('prev');
      if (e.key === 'Escape') setFullscreenTab(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenTab]);

  const currentAudioUrl = fullscreenTab === 'etymology' ? report.etymologyAudioUrl :
           fullscreenTab === 'geography' ? report.geoAudioUrl :
           fullscreenTab === 'social' ? report.socialAudioUrl :
           fullscreenTab === 'variability' ? report.variabilityAudioUrl : undefined;

  const playingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (fullscreenTab) {
      if (currentAudioUrl && playingUrlRef.current !== currentAudioUrl) {
        playingUrlRef.current = currentAudioUrl;
        if (audioRef.current) {
          audioRef.current.src = currentAudioUrl;
          audioRef.current.play().catch(console.error);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        playingUrlRef.current = null;
      }
    }
  }, [fullscreenTab, currentAudioUrl]);

  const navigateFullscreen = (direction: 'next' | 'prev') => {
    if (!fullscreenTab) return;
    const currentIndex = sections.indexOf(fullscreenTab);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % sections.length;
    } else {
      nextIndex = (currentIndex - 1 + sections.length) % sections.length;
    }
    setFullscreenTab(sections[nextIndex]);
  };

  const SectionCard = ({ type, index }: { type: SectionKey, index: string }) => {
    const data = {
      etymology: { text: report.etymology, img: report.etymologyImageUrl, title: 'Etymology' },
      geography: { text: report.geographicDistribution, img: report.geoImageUrl, title: 'Geographic Distribution' },
      social: { text: report.socialAnalysis, img: report.socialImageUrl, title: 'Social Analysis' },
      variability: { text: report.variability, img: report.variabilityImageUrl, title: 'Variability' },
    }[type];

    return (
      <section 
        onClick={() => setFullscreenTab(type)}
        className="bg-parchment p-8 rounded-2xl shadow-sm border border-stone-200 break-inside-avoid cursor-pointer transition-all hover:shadow-xl hover:border-amber-800/20 group"
      >
        <h3 className="serif text-3xl font-bold text-amber-900 mb-5 border-b-2 border-amber-800/10 pb-2">
          {index}. {data.title}
        </h3>
        <p className="text-stone-800 leading-relaxed text-lg whitespace-pre-wrap mb-6">
          {data.text}
        </p>
        
        {data.img ? (
          <div className="mt-6 rounded-xl overflow-hidden border-2 border-stone-200 shadow-md relative">
            <img crossOrigin="anonymous" src={data.img} alt={data.title} className="w-full h-auto object-cover max-h-[300px]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg">
                <Maximize2 className="w-5 h-5 text-stone-900" />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 bg-stone-100 animate-pulse rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 italic text-sm p-4 text-center">
            Archival visual pending...
          </div>
        )}
      </section>
    );
  };

  return (
    <div id="research-report-container" className="max-w-6xl mx-auto py-10">
      <audio ref={audioRef} className="hidden" muted={isMuted} />
      <LiveAssistant />
      
      <div id="research-report" className="animate-fade-in space-y-10 p-4 md:p-8 bg-[#f8f5f2]">
        {/* Official Archive Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-800 pb-4 mb-8">
          <div className="text-left">
            <p className="font-bold uppercase tracking-widest text-xs text-stone-800">Onomastica Research Lab</p>
            <p className="text-[10px] text-stone-500 italic">Historical & Genealogical Research Division</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Record ID: {Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
            <p className="text-[10px] text-stone-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 border-b-2 border-amber-800/10 pb-8">
          <h2 className="serif text-5xl md:text-6xl font-bold text-stone-900 leading-tight">Historical Dossier: {report.name}</h2>
          <p className="text-amber-900/70 italic text-2xl font-light">Research Subject Origin: {report.geography}</p>
        </div>

        {/* Main Header Illustration */}
        {report.headerImageUrl && (
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border-4 border-stone-200">
            <img 
              crossOrigin="anonymous"
              src={report.headerImageUrl} 
              alt={`Archetypal view of ${report.name}`}
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-stone-900/70 backdrop-blur-md p-4 text-white text-sm italic">
              Archetypal Lineage Visualization: {report.name}
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SectionCard type="etymology" index="I" />
          <SectionCard type="geography" index="II" />
          <SectionCard type="social" index="III" />
          <SectionCard type="variability" index="IV" />
        </div>

        {/* Archives */}
        <section className="bg-stone-900 text-stone-100 p-10 rounded-2xl border-2 border-stone-800">
          <h3 className="serif text-3xl font-bold mb-6 text-amber-500">V. Primary Source Repositories</h3>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {report.archives.map((archive, index) => (
              <li key={index} className="flex items-start space-x-4 group">
                <span className="text-amber-500 font-bold text-xl">◈</span>
                <div className="flex flex-col">
                  <a 
                    href={archive.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-amber-100 hover:text-amber-400 transition-colors underline decoration-amber-800 underline-offset-4"
                  >
                    {archive.name}
                  </a>
                  <span className="text-xs text-stone-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open archival portal in new tab ↗
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {fullscreenTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-stone-950 flex flex-col md:flex-row overflow-hidden"
          >
            {/* Close Button - Visible on black circle */}
            <button 
              onClick={() => setFullscreenTab(null)}
              className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-black text-white hover:bg-stone-800 transition-all shadow-2xl border border-white/20"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            <div className="absolute bottom-8 left-8 z-[210] flex items-center space-x-4">
              <button 
                onClick={() => navigateFullscreen('prev')}
                className="p-4 rounded-full bg-black/50 text-white hover:bg-black transition-all backdrop-blur-md border border-white/10 flex items-center space-x-2"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest pr-2">Back</span>
              </button>
            </div>

            <div className="absolute bottom-8 right-8 z-[210] flex items-center space-x-4">
              <button 
                onClick={() => navigateFullscreen('next')}
                className="p-4 rounded-full bg-black/50 text-white hover:bg-black transition-all backdrop-blur-md border border-white/10 flex items-center space-x-2"
              >
                <span className="text-sm font-bold uppercase tracking-widest pl-2">Front</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 h-1/2 md:h-full relative bg-stone-900 flex items-center justify-center p-4">
              <img 
                crossOrigin="anonymous"
                src={
                  fullscreenTab === 'etymology' ? report.etymologyImageUrl :
                  fullscreenTab === 'geography' ? report.geoImageUrl :
                  fullscreenTab === 'social' ? report.socialImageUrl :
                  report.variabilityImageUrl
                } 
                alt="Fullscreen visual"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
              <div className="absolute top-8 left-8 flex items-center space-x-4">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className={`w-6 h-6 ${!currentAudioUrl ? 'opacity-50' : 'animate-pulse'}`} />}
                </button>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                  {isMuted ? 'Narration Muted' : !currentAudioUrl ? 'Generating Narration...' : 'Narration Playing'}
                </div>
              </div>
            </div>

            <div className="w-full md:w-[450px] h-1/2 md:h-full bg-parchment p-8 md:p-12 overflow-y-auto border-l border-stone-800/20">
              <div className="max-w-md mx-auto space-y-8">
                <div className="space-y-2">
                  <p className="text-amber-800 font-bold uppercase tracking-widest text-xs">Archival Segment</p>
                  <h2 className="serif text-4xl font-bold text-stone-900">
                    {fullscreenTab === 'etymology' ? 'Etymological Roots' :
                     fullscreenTab === 'geography' ? 'Geographic Distribution' :
                     fullscreenTab === 'social' ? 'Social Analysis' :
                     'Phonetic Variability'}
                  </h2>
                </div>
                <div className="w-12 h-1 bg-amber-800/20" />
                <p className="text-stone-800 text-xl leading-relaxed italic font-light">
                  {fullscreenTab === 'etymology' ? report.etymology :
                   fullscreenTab === 'geography' ? report.geographicDistribution :
                   fullscreenTab === 'social' ? report.socialAnalysis :
                   report.variability}
                </p>
                <div className="pt-12 border-t border-stone-200">
                  <p className="text-stone-400 text-sm italic">Record ID: {Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Action */}
      <div className="no-print flex flex-col items-center space-y-4 mt-12 py-8 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
        <button 
          onClick={handleDownload}
          disabled={isCapturing}
          className={`group flex items-center space-x-4 px-10 py-5 text-white rounded-2xl font-bold text-xl transition-all transform hover:-translate-y-1 shadow-2xl outline-none ${
            isCapturing ? 'bg-stone-500 cursor-not-allowed' : 'bg-stone-900 hover:bg-black ring-offset-2 ring-amber-600 focus:ring-4'
          }`}
        >
          {isCapturing ? (
            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Download className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
          )}
          <span>{isCapturing ? 'Processing Screenshot...' : 'Save Research as Image (PNG)'}</span>
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;
