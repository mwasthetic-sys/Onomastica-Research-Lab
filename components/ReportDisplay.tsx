
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
  const [fullscreenTab, setFullscreenTab] = useState<SectionKey | null>('etymology');
  const [isMuted, setIsMuted] = useState(false);
  const [revealedStep, setRevealedStep] = useState(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [replayState, setReplayState] = useState<{ tab: SectionKey, sentenceIndex: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const inlineAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({ revealedStep, currentSentenceIndex, report, replayState });
  useEffect(() => {
    stateRef.current = { revealedStep, currentSentenceIndex, report, replayState };
  }, [revealedStep, currentSentenceIndex, report, replayState]);

  useEffect(() => {
    if (!fullscreenTab) {
      setReplayState(null);
    }
  }, [fullscreenTab]);

  const sections: SectionKey[] = ['etymology', 'geography', 'social', 'variability'];

  const activeTab = replayState ? replayState.tab : (
    revealedStep === 1 ? 'etymology' :
    revealedStep === 2 ? 'geography' :
    revealedStep === 3 ? 'social' :
    revealedStep === 4 ? 'variability' : null
  );
  
  const activeSentenceIndex = replayState ? replayState.sentenceIndex : currentSentenceIndex;

  const inlineAudioUrl = activeTab ? (
    activeTab === 'etymology' ? report.etymologyAudioUrls?.[activeSentenceIndex] :
    activeTab === 'geography' ? report.geoAudioUrls?.[activeSentenceIndex] :
    activeTab === 'social' ? report.socialAudioUrls?.[activeSentenceIndex] :
    activeTab === 'variability' ? report.variabilityAudioUrls?.[activeSentenceIndex] : undefined
  ) : undefined;

  const currentText = activeTab ? (
    activeTab === 'etymology' ? report.etymology?.[activeSentenceIndex] :
    activeTab === 'geography' ? report.geographicDistribution?.[activeSentenceIndex] :
    activeTab === 'social' ? report.socialAnalysis?.[activeSentenceIndex] :
    activeTab === 'variability' ? report.variability?.[activeSentenceIndex] : undefined
  ) : undefined;

  const handleInlineEnded = () => {
    const { revealedStep: rs, currentSentenceIndex: csi, report: r, replayState: rep } = stateRef.current;
    
    if (rep) {
      const { tab, sentenceIndex } = rep;
      const currentTextArray = 
        tab === 'etymology' ? r.etymology :
        tab === 'geography' ? r.geographicDistribution :
        tab === 'social' ? r.socialAnalysis :
        tab === 'variability' ? r.variability : [];
      
      if (currentTextArray && sentenceIndex >= currentTextArray.length - 1) {
        setReplayState(null);
        setStepProgress(0);
      } else {
        setReplayState({ tab, sentenceIndex: sentenceIndex + 1 });
        setStepProgress(0);
      }
      return;
    }

    const currentTextArray = 
      rs === 1 ? r.etymology :
      rs === 2 ? r.geographicDistribution :
      rs === 3 ? r.socialAnalysis :
      rs === 4 ? r.variability : [];
      
    const isSectionComplete = 
      rs === 1 ? r.etymologyComplete :
      rs === 2 ? r.geoComplete :
      rs === 3 ? r.socialComplete :
      rs === 4 ? r.variabilityComplete : true;

    if (currentTextArray && csi >= currentTextArray.length - 1 && isSectionComplete) {
      setIsTransitioning(true);
      setRevealedStep(s => s + 1);
      setCurrentSentenceIndex(0);
      setStepProgress(0);
      
      // Auto-transition fullscreen tab
      setFullscreenTab(prev => {
        if (!prev) return null;
        if (rs === 1) return 'geography';
        if (rs === 2) return 'social';
        if (rs === 3) return 'variability';
        return prev;
      });

      setTimeout(() => {
        setIsTransitioning(false);
      }, 1200);
    } else {
      setCurrentSentenceIndex(s => s + 1);
      setStepProgress(0);
    }
  };

  // Inline Audio Management
  useEffect(() => {
    const audio = inlineAudioRef.current;
    if (!audio) return;

    // Cancel any ongoing fallback speech when url changes
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!inlineAudioUrl || isTransitioning) {
      audio.pause();
      return;
    }

    if (inlineAudioUrl === "FAILED") {
      if (currentText && 'speechSynthesis' in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(currentText);
        
        // Try to find a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                               voices.find(v => v.lang === 'en-GB') || 
                               voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 0.95; // Slightly slower for academic feel
        
        utterance.onend = () => {
          handleInlineEnded();
        };
        utterance.onerror = (e) => {
          console.error("Web Speech API error", e);
          handleInlineEnded();
        };
        
        // Simulate progress for the UI
        setStepProgress(1); 
        
        window.speechSynthesis.speak(utterance);
      } else {
        // If muted or no speech synthesis, just skip after a short delay to allow reading
        const delay = currentText ? Math.max(2000, currentText.length * 50) : 1000;
        const timer = setTimeout(() => {
          handleInlineEnded();
        }, isMuted ? delay : 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (inlineAudioUrl) {
      if (audio.getAttribute('data-current-src') !== inlineAudioUrl) {
        audio.src = inlineAudioUrl;
        audio.setAttribute('data-current-src', inlineAudioUrl);
        audio.currentTime = 0;
        setStepProgress(0);
        audio.play().catch(e => console.error("Inline audio play failed", e));
      } else if (audio.paused) {
        audio.play().catch(e => console.error("Inline audio resume failed", e));
      }
    }
  }, [inlineAudioUrl, currentText, isMuted, isTransitioning]);

  // Mute Management
  useEffect(() => {
    if (inlineAudioRef.current) inlineAudioRef.current.muted = isMuted;
    if (isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  // Auto-scroll text container during initial narration
  useEffect(() => {
    if (scrollContainerRef.current && !replayState && revealedStep <= 4) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [currentSentenceIndex, stepProgress, fullscreenTab, revealedStep, replayState]);

  const handleInlineTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const target = e.target as HTMLAudioElement;
    if (target.duration) {
      setStepProgress(target.currentTime / target.duration);
    }
  };

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

  const navigateFullscreen = (direction: 'next' | 'prev') => {
    if (!fullscreenTab) return;
    const currentIndex = sections.indexOf(fullscreenTab);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % sections.length;
    } else {
      nextIndex = (currentIndex - 1 + sections.length) % sections.length;
    }
    const nextTab = sections[nextIndex];
    setFullscreenTab(nextTab);
    setReplayState(prev => prev ? { tab: nextTab, sentenceIndex: 0 } : null);
  };

  const getFullscreenText = () => {
    if (!fullscreenTab) return "";
    const stepNumber = fullscreenTab === 'etymology' ? 1 :
                       fullscreenTab === 'geography' ? 2 :
                       fullscreenTab === 'social' ? 3 : 4;
    const dataArray = fullscreenTab === 'etymology' ? report.etymology :
                      fullscreenTab === 'geography' ? report.geographicDistribution :
                      fullscreenTab === 'social' ? report.socialAnalysis :
                      report.variability;

    if (!dataArray || dataArray.length === 0) return "Analyzing historical records...";

    const isRevealingThisTab = !replayState && revealedStep === stepNumber;

    if (isRevealingThisTab) {
      const activeIndex = currentSentenceIndex;
      const fullyRevealedSentences = dataArray.slice(0, activeIndex).join(' ');
      
      let currentSentenceProgress = "";
      if (activeIndex < dataArray.length) {
        const currentSentence = dataArray[activeIndex];
        currentSentenceProgress = currentSentence.slice(0, Math.max(1, Math.floor(currentSentence.length * stepProgress)));
      }
      
      return fullyRevealedSentences + (fullyRevealedSentences && currentSentenceProgress ? ' ' : '') + currentSentenceProgress;
    } else if (revealedStep > stepNumber || replayState) {
      return dataArray.join(' ');
    } else {
      return "Awaiting narration...";
    }
  };

  const renderSectionCard = (type: SectionKey, index: string, stepNumber: number) => {
    const data = {
      etymology: { textArray: report.etymology, img: report.etymologyImageUrl, audioUrls: report.etymologyAudioUrls, title: 'Etymology' },
      geography: { textArray: report.geographicDistribution, img: report.geoImageUrl, audioUrls: report.geoAudioUrls, title: 'Geographic Distribution' },
      social: { textArray: report.socialAnalysis, img: report.socialImageUrl, audioUrls: report.socialAudioUrls, title: 'Social Analysis' },
      variability: { textArray: report.variability, img: report.variabilityImageUrl, audioUrls: report.variabilityAudioUrls, title: 'Variability' },
    }[type];

    const isReady = data.textArray && data.textArray.length > 0 && data.audioUrls && data.audioUrls.length > 0;
    const isRevealed = revealedStep >= stepNumber;

    if (!isReady || !isRevealed) return null;

    let displayedText = "";
    if (revealedStep === stepNumber) {
      const fullyRevealedSentences = data.textArray.slice(0, currentSentenceIndex).join(' ');
      
      let currentSentenceProgress = "";
      if (currentSentenceIndex < data.textArray.length) {
        const currentSentence = data.textArray[currentSentenceIndex];
        currentSentenceProgress = currentSentence.slice(0, Math.max(1, Math.floor(currentSentence.length * stepProgress)));
      }
      
      displayedText = fullyRevealedSentences + (fullyRevealedSentences && currentSentenceProgress ? ' ' : '') + currentSentenceProgress;
    } else {
      displayedText = data.textArray.join(' ');
    }

    return (
      <section 
        key={type}
        onClick={() => {
          if (revealedStep <= 4) {
            const currentActive = revealedStep === 1 ? 'etymology' :
                                  revealedStep === 2 ? 'geography' :
                                  revealedStep === 3 ? 'social' :
                                  revealedStep === 4 ? 'variability' : type;
            setFullscreenTab(currentActive);
          } else {
            setFullscreenTab(type);
          }
        }}
        className="bg-parchment p-8 rounded-2xl shadow-sm border border-stone-200 break-inside-avoid cursor-pointer transition-all hover:shadow-xl hover:border-amber-800/20 group animate-fade-in"
      >
        <h3 className="serif text-3xl font-bold text-amber-900 mb-5 border-b-2 border-amber-800/10 pb-2">
          {index}. {data.title}
        </h3>
        <p className="text-stone-800 leading-relaxed text-lg whitespace-pre-wrap mb-6">
          {displayedText}
        </p>
        
        <div className="mt-6 rounded-xl overflow-hidden border-2 border-stone-200 shadow-md relative">
          <img crossOrigin="anonymous" src={data.img} alt={data.title} className="w-full h-auto object-cover max-h-[300px]" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg">
              <Maximize2 className="w-5 h-5 text-stone-900" />
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div id="research-report-container" className="max-w-6xl mx-auto py-10">
      <audio 
        ref={inlineAudioRef} 
        className="hidden" 
        onTimeUpdate={handleInlineTimeUpdate}
        onEnded={handleInlineEnded}
      />
      <LiveAssistant />
      
      <div id="research-report" className="animate-fade-in space-y-10 p-4 md:p-8 bg-[#f8f5f2]">
        {/* Official Archive Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-800 pb-4 mb-8">
          <div className="text-left">
            <p className="font-bold uppercase tracking-widest text-xs text-stone-800">Onomastica Research Lab</p>
            <p className="text-[10px] text-stone-500 italic">Historical & Genealogical Research Division</p>
          </div>
          <div className="text-right flex items-center space-x-4">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 rounded-full hover:bg-stone-200 transition-colors"
              title={isMuted ? "Unmute Narration" : "Mute Narration"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-stone-500" /> : <Volume2 className="w-5 h-5 text-stone-800" />}
            </button>
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Record ID: {Math.floor(Date.now() / 1000).toString().slice(-6)}</p>
              <p className="text-[10px] text-stone-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
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
          {renderSectionCard('etymology', 'I', 1)}
          {renderSectionCard('geography', 'II', 2)}
          {renderSectionCard('social', 'III', 3)}
          {renderSectionCard('variability', 'IV', 4)}
        </div>

        {/* Archives */}
        {revealedStep >= 5 && report.archives && report.archives.length > 0 && (
          <section className="bg-stone-900 text-stone-100 p-10 rounded-2xl border-2 border-stone-800 animate-fade-in">
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
        )}
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {fullscreenTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[190] bg-stone-950"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {fullscreenTab && (
          <motion.div
            key={fullscreenTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex flex-col md:flex-row overflow-hidden"
          >
            {/* Close Button / View Full Report */}
            {revealedStep >= 5 ? (
              <button 
                onClick={() => setFullscreenTab(null)}
                className="absolute top-6 right-6 z-[210] px-6 py-3 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-2xl font-bold tracking-widest uppercase text-sm border border-amber-500/50"
              >
                View Full Report
              </button>
            ) : (
              <button 
                onClick={() => setFullscreenTab(null)}
                className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-black text-white hover:bg-stone-800 transition-all shadow-2xl border border-white/20"
              >
                <X className="w-8 h-8" />
              </button>
            )}

            {/* Navigation Buttons */}
            {revealedStep >= 5 && (
              <>
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
              </>
            )}

            <div className="flex-1 h-1/2 md:h-full relative bg-stone-900 flex items-center justify-center p-4">
              {(() => {
                const imgSrc = fullscreenTab === 'etymology' ? report.etymologyImageUrl :
                               fullscreenTab === 'geography' ? report.geoImageUrl :
                               fullscreenTab === 'social' ? report.socialImageUrl :
                               report.variabilityImageUrl;
                if (imgSrc) {
                  return (
                    <img 
                      crossOrigin="anonymous"
                      src={imgSrc} 
                      alt="Fullscreen visual"
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-fade-in"
                    />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                      <p className="text-stone-400 text-sm uppercase tracking-widest font-bold">Developing Archival Image...</p>
                    </div>
                  );
                }
              })()}
              <div className="absolute top-8 left-8 flex items-center space-x-4">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className={`w-6 h-6 ${!inlineAudioUrl ? 'opacity-50' : 'animate-pulse'}`} />}
                </button>
                {revealedStep >= 5 && !replayState && (
                  <button
                    onClick={() => setReplayState({ tab: fullscreenTab, sentenceIndex: 0 })}
                    className="px-4 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md flex items-center space-x-2"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">Replay Narration</span>
                  </button>
                )}
                {!(revealedStep >= 5 && !replayState) && (
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                    {isMuted ? 'Narration Muted' : !inlineAudioUrl ? 'Generating Narration...' : 'Narration Playing'}
                  </div>
                )}
              </div>
            </div>

            <div 
              ref={scrollContainerRef}
              className="w-full md:w-[450px] h-1/2 md:h-full bg-parchment p-8 md:p-12 overflow-y-auto border-l border-stone-800/20 scroll-smooth"
            >
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
                <p className="text-stone-800 text-xl leading-relaxed italic font-light whitespace-pre-wrap">
                  {getFullscreenText()}
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
