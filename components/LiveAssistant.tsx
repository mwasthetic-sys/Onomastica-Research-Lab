
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { getApiKey } from '../services/geminiService';

const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [assistantResponse, setAssistantResponse] = useState<string>("");
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const toggleAssistant = () => {
    if (isOpen) {
      disconnect();
    } else {
      setIsOpen(true);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      const apiKey = await getApiKey();
      const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
      
      // Use 24000Hz for output, but 16000Hz is standard for input
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      await audioContextRef.current.audioWorklet.addModule('data:text/javascript;base64,' + btoa(`
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0][0];
            if (input) {
              this.port.postMessage(input);
            }
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `));

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      source.connect(workletNodeRef.current);
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            console.log("Live session connected");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setAssistantResponse(prev => prev + " " + message.serverContent?.modelTurn?.parts[0]?.text);
            }

            if (message.serverContent?.interrupted) {
              // Stop all active sources on interruption
              activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
              });
              activeSourcesRef.current = [];
              if (audioContextRef.current) {
                nextStartTimeRef.current = audioContextRef.current.currentTime;
              }
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsOpen(false);
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are an expert onomastician and genealogist. You help users understand the history, etymology, and distribution of names. Be professional, academic, and engaging.",
        },
      });

      sessionRef.current = await sessionPromise;

      workletNodeRef.current.port.onmessage = (event) => {
        if (!isMuted && sessionRef.current) {
          const pcmData = event.data;
          // Convert Float32 to Int16 PCM
          const int16Data = new Int16Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            int16Data[i] = Math.max(-1, Math.min(1, pcmData[i])) * 0x7FFF;
          }
          const uint8Data = new Uint8Array(int16Data.buffer);
          let binary = '';
          for (let i = 0; i < uint8Data.length; i++) {
            binary += String.fromCharCode(uint8Data[i]);
          }
          const base64Data = btoa(binary);
          sessionRef.current.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

    } catch (err) {
      console.error("Connection failed:", err);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    setIsConnected(false);
    setIsOpen(false);
    setTranscription("");
    setAssistantResponse("");
  };

  const playAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 0x7FFF;
    }
    
    // Gemini Live API output is 24000Hz
    const sampleRate = 24000;
    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, sampleRate);
    buffer.getChannelData(0).set(float32Data);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    // Track source to allow stopping on interruption
    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
    };

    // Schedule playback to avoid overlaps
    const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  return (
    <>
      <button
        onClick={toggleAssistant}
        className="fixed bottom-24 right-4 z-50 bg-amber-800 text-white p-4 rounded-full shadow-2xl hover:bg-amber-900 transition-all transform hover:scale-110 flex items-center space-x-2"
      >
        <Mic className="w-6 h-6" />
        <span className="font-bold text-sm pr-2">Ask Live</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="bg-stone-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <h3 className="serif text-xl font-bold">Onomastica Live Assistant</h3>
              </div>
              <button onClick={disconnect} className="hover:bg-white/10 p-1 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50">
              {!isConnected && !isConnecting && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="bg-amber-100 p-6 rounded-full">
                    <Volume2 className="w-12 h-12 text-amber-800" />
                  </div>
                  <h4 className="text-xl font-bold text-stone-800">Ready to consult?</h4>
                  <p className="text-stone-500">Connect to start a live voice conversation with our archival intelligence.</p>
                  <button
                    onClick={connect}
                    className="bg-amber-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-900 transition-all"
                  >
                    Establish Connection
                  </button>
                </div>
              )}

              {isConnecting && (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-800 rounded-full animate-spin" />
                  <p className="text-stone-600 font-medium">Connecting to archival core...</p>
                </div>
              )}

              {isConnected && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                    <p className="text-xs font-bold text-stone-400 uppercase mb-2">Assistant Response</p>
                    <p className="text-stone-800 leading-relaxed italic">
                      {assistantResponse || "Listening for your questions..."}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-6 rounded-full transition-all ${isMuted ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-800 animate-pulse'}`}
                      >
                        {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-sm text-stone-400 font-medium">
                    {isMuted ? "Microphone Muted" : "Microphone Active - Speak Now"}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-stone-100 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Encrypted Archival Link</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveAssistant;
