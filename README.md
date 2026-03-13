# Onomastica Research Lab 📜🔍

**A submission for the Gemini Live Agent Challenge (Creative Storyteller Category)**

Onomastica Research Lab is a next-generation genealogical and etymological AI agent. It moves beyond the standard text box by acting as a professional historian and creative director. It researches the origins of any given surname or name and weaves together a rich, mixed-media report containing deep historical text, generated archival illustrations, and professional audio narration—all in one cohesive flow.

## ✨ Features

*   **Deep Etymological Research:** Uses **Gemini 3.1 Pro** to analyze linguistic roots, geographic distribution, social class history, and spelling variability.
*   **Interleaved Visual Storytelling:** Uses **Gemini 2.5 Flash Image** to generate highly detailed, context-aware historical illustrations (like antique maps or illuminated manuscripts) that are woven directly into the report.
*   **Immersive Audio Narration:** Uses **Gemini 2.5 Flash TTS (Text-to-Speech)** to narrate the research findings in a professional, academic voice, creating a truly multimodal experience.
*   **Real-time Streaming:** Streams the research report in real-time so users can read along as the agent "thinks" and generates content.

## 🛠️ Tech Stack

*   **AI SDK:** Official `@google/genai` SDK
*   **Models:** `gemini-3.1-pro-preview`, `gemini-2.5-flash-image`, `gemini-2.5-flash-preview-tts`
*   **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
*   **Backend/Hosting:** Express.js, deployed on **Google Cloud Run**

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    User([User]) -->|Enters Name| UI[React Frontend]
    UI -->|Hosted on| GCR[Google Cloud Run]
    
    subgraph Google Cloud
        GCR
    end
    
    UI -->|@google/genai SDK| API{Gemini API}
    
    subgraph Multimodal AI Agents
        API -->|Research & Reasoning| Pro[gemini-3.1-pro-preview]
        API -->|Historical Illustrations| Img[gemini-2.5-flash-image]
        API -->|Voice Narration| TTS[gemini-2.5-flash-preview-tts]
    end
    
    Pro -->|Streams JSON Report| UI
    Img -->|Base64 Image Data| UI
    TTS -->|WAV Audio Data| UI
```

## 🚀 Spin-up Instructions (For Judges)

Follow these steps to reproduce and run the project locally on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   npm (comes with Node.js)
*   A [Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_DIRECTORY>
```

### 2. Install Dependencies
Install the required packages using npm:
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory of the project:
```bash
touch .env
```
Open the `.env` file and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```
*(Note: The `vite.config.ts` is configured to automatically pick up `GEMINI_API_KEY` and inject it into the app).*

### 4. Run the Development Server
Start the local development server:
```bash
npm run dev
```

### 5. View the App
Open your browser and navigate to:
```text
http://localhost:3000
```
You can now enter a name (e.g., "Smith", "Tanaka", "García") and watch the multimodal agent generate a complete historical report!

---

## ☁️ Google Cloud Deployment

This project is containerized and deployed using **Google Cloud Run**, fulfilling the requirement to use at least one Google Cloud service. 

*   **Live URL:** [Insert your .run.app URL here]
*   **Proof of Deployment:** See the included demonstration video or the `server.ts` / `Dockerfile` configurations in this repository.

## 📝 License
MIT License
