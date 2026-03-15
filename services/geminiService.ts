
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ResearchFormData, ResearchReport } from "../types";

let cachedApiKey = "";
export const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.apiKey) {
      cachedApiKey = data.apiKey;
    }
  } catch (e) {
    console.error("Failed to fetch API key", e);
  }
  return cachedApiKey;
};

export const generateResearchReportStream = async (
  data: ResearchFormData,
  onUpdate: (partialReport: Partial<ResearchReport>) => void
): Promise<ResearchReport> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
  
  const systemPrompt = `You are a world-class onomastics expert and professional genealogist. 
Your task is to provide a deep research report on a given name or surname.

Follow this Research Protocol strictly:
1. Origin: If the user provides a geography, use it. If not, predict the most likely historical origin of the name based on linguistic and historical data.
2. Etymology: Analyze the linguistic root. Is it patronymic, professional, topographic, or a nickname? Check for roots in relevant language groups.
3. Geographic Distribution: Identify historical "hubs" of this surname prior to the 20th century using census data and regional records.
4. Social Analysis: Determine which social classes or groups typically held this name in the specified region.
5. Variability: Check for phonetic distortions and common spelling variations in historical registers.
6. Archives: List specific archives (e.g., National Archives, church records) and document types for further verification. Provide a real or highly relevant URL for each archive's online portal or catalog.

You MUST output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
The JSON must have the following keys:
- "geography" (string)
- "etymology" (string)
- "geographicDistribution" (string)
- "socialAnalysis" (string)
- "variability" (string)
- "archives" (array of objects with "name" and "url" strings)`;

  const userPrompt = `
Context:
Name(s): ${data.name}
User-Provided Geography: ${data.geography || "Not provided - please predict based on name history"}.
Known Facts: ${data.facts || "No additional facts provided."}.

Research Protocol:
Origin: Determine historical origin.
Etymology: Analyze linguistic root.
Geographic Distribution: Identify historical hubs.
Social Analysis: Class and group history.
Variability: Spelling distortions and variants.
Archives: List 4 specific repositories with their names and URLs.
Output: A structured JSON report.
  `;

  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  let accumulatedText = "";
  for await (const chunk of response) {
    accumulatedText += chunk.text;
    
    const partialReport: Partial<ResearchReport> = {};
    
    // Simple regex-based extraction for partial JSON
    const extractString = (key: string) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`);
      const match = accumulatedText.match(regex);
      if (match) {
          return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      return undefined;
    };

    partialReport.geography = extractString('geography');
    partialReport.etymology = extractString('etymology');
    partialReport.geographicDistribution = extractString('geographicDistribution');
    partialReport.socialAnalysis = extractString('socialAnalysis');
    partialReport.variability = extractString('variability');
    
    const archivesMatch = accumulatedText.match(/"archives"\s*:\s*(\[[\s\S]*?\])/);
    if (archivesMatch) {
      try {
        partialReport.archives = JSON.parse(archivesMatch[1]);
      } catch (err) {}
    }

    onUpdate(partialReport);
  }

  const cleanJsonText = accumulatedText.replace(/```json/g, '').replace(/```/g, '').trim();
  const reportJson = JSON.parse(cleanJsonText || "{}");
  
  return {
    name: data.name,
    facts: data.facts || "None",
    ...reportJson
  };
};

export const generateSectionIllustration = async (name: string, sectionType: string, context: string): Promise<string> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
  
  let visualTheme = "";
  switch(sectionType) {
    case 'etymology': visualTheme = "Ancient scrolls, quill pens, and linguistic symbols representing the root of the word."; break;
    case 'geography': visualTheme = "A detailed antique vintage map showing migration routes or regional hubs."; break;
    case 'social': visualTheme = "Heraldic imagery, historical town life, or symbols of social status and trade."; break;
    case 'variability': visualTheme = "Close-up of weathered ledger pages with different historical handwriting styles."; break;
    default: visualTheme = "Archival imagery.";
  }

  const prompt = `A highly detailed historical illustration for the name '${name}'. 
Subject: ${visualTheme} 
Context from research: ${context.substring(0, 150)}. 
Style: Classic archival ink sketch or muted atmospheric oil painting on parchment. Elegant and professional. No text in image.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  let textResponse = "";
  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }
  }

  console.error("Image generation response:", JSON.stringify(response));
  throw new Error(`Failed to generate image. Model returned: ${textResponse || 'No image data'}`);
};

export const generateNarration = async (text: string): Promise<string> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
  
  // Clean text and truncate to avoid TTS model limits and internal errors
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  const safeText = cleanText.length > 1500 ? cleanText.substring(0, 1500) + "..." : cleanText;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say in a professional, slightly academic, but warm and engaging voice: ${safeText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    // Gemini TTS returns raw PCM 24000Hz 16-bit mono. 
    // We need to add a WAV header so browsers can play it via <audio> tag.
    const rawData = atob(base64Audio);
    const numSamples = rawData.length / 2;
    const sampleRate = 24000;
    const bitsPerSample = 16;
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = rawData.length;
    const chunkSize = 36 + dataSize;

    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // RIFF identifier
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    // file length
    view.setUint32(4, chunkSize, true);
    // RIFF type
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));
    // format chunk identifier
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data chunk identifier
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    // data chunk length
    view.setUint32(40, dataSize, true);

    const headerUint8 = new Uint8Array(header);
    const dataUint8 = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      dataUint8[i] = rawData.charCodeAt(i);
    }

    const combined = new Uint8Array(headerUint8.length + dataUint8.length);
    combined.set(headerUint8);
    combined.set(dataUint8, headerUint8.length);

    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    const combinedBase64 = btoa(binary);
    
    return `data:audio/wav;base64,${combinedBase64}`;
  }

  throw new Error("Failed to generate audio");
};
