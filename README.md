# Khet Doctor AI (खेत डॉक्टर)

<div align="center">

![Khet Doctor AI Banner](https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80)

### **AI-Powered Crop Disease Diagnosis & Agricultural Advisory for Farmers**

[![Live Demo](https://img.shields.io/badge/Live_Demo-khet--doctor--ai.vercel.app-00C781?style=for-the-badge&logo=vercel&logoColor=white)](https://khet-doctor-ai.vercel.app/)
[![Google Gemini](https://img.shields.io/badge/Powered%20By-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

### **Live Website:** [https://khet-doctor-ai.vercel.app/](https://khet-doctor-ai.vercel.app/)

</div>

---

## Overview

**Khet Doctor AI (खेत डॉक्टर)** is an intelligent agricultural assistant designed to help farmers detect crop diseases, pests, and nutrient deficiencies early. By leveraging Google's **Gemini Vision AI**, farmers can simply snap a photo or upload an image of an affected plant leaf or crop and receive:

1. **Instant, reliable preliminary diagnosis** with confidence scores and severity levels.
2. **Actionable step-by-step treatment plans** (immediate actions, 2-3 day monitoring, and critical mistakes to avoid).
3. **Multilingual voice support** in 8+ regional languages so farmers can speak, listen, and understand solutions without language barriers.

---

## Key Features

- **Camera & Image Upload**: Capture live crop photos directly from mobile camera or upload from gallery. Includes sample crops (Wheat, Tomato, Cotton) for quick testing.
- **Intelligent Diagnosis & Severity Rating**:
  - Identified Crop & Suspected Disease / Pest
  - Confidence Percentage & Severity Badge (Low / Medium / High)
  - Observable Symptoms breakdown & Potential Causes
  - Alternative possibilities to prevent misdiagnosis
- **Structured Action Plan for Farmers**:
  - **Today's Immediate Actions**: Quick organic/cultural steps to prevent disease spread.
  - **Next 2-3 Days Care**: What to observe and how the crop should respond.
  - **Things to Avoid**: Crucial warnings preventing accidental chemical burn or pesticide misuse.
  - **Worsening Signs & Escalation**: Clear guidelines on when to consult local Krishi Vigyan Kendra (KVK).
- ️ **Voice Context & Audio Summary (Text-to-Speech)**:
  - Farmers can speak their problem using the built-in microphone.
  - Built-in Voice Readout feature summarizes the findings out loud in 15–30 seconds.
- **Multilingual Regional Language Support**:
  - **Hindi (हिंदी)**
  - **English**
  - ️ **Hinglish**
  - **Punjabi (ਪੰਜਾਬੀ)**
  - **Marathi (मराठी)**
  - **Bengali (বাংলা)**
  - ️ **Tamil (தமிழ்)**
  - ️ **Telugu (తెలుగు)**
- **Interactive Smart Follow-up Questions**: Allows farmers to answer tailored follow-up queries (plant age, recent weather, soil conditions) to further refine the AI diagnosis.
- ️ **Built-in Safety & Agronomic Guardrails**: Refuses to blindly recommend harmful chemical cocktails and provides safety disclaimers.

---

## Live Demo

Experience Khet Doctor AI directly in your browser:

 **[https://khet-doctor-ai.vercel.app/](https://khet-doctor-ai.vercel.app/)**

*(Mobile responsive - installable as PWA / bookmark on Android & iOS devices)*

---

## ️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Motion (Framer Motion)](https://motion.dev/), [Lucide React](https://lucide.dev/) |
| **AI Model & SDK** | [Google Gemini 2.5 Flash / Pro](https://ai.google.dev/) via `@google/genai` |
| **Backend / API** | Express.js (Local development) & Vercel Serverless Functions (`/api/analyze-crop`) |
| **Speech APIs** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) |
| **Hosting & Deployment** | [Vercel](https://vercel.com) & [Netlify](https://netlify.com) support |

---

## Project Structure

```text
khet-doctor-ai/
├── api/                         # Vercel Serverless API functions
│   └── analyze-crop.ts          # Gemini AI crop diagnosis endpoint
├── netlify/                     # Netlify serverless functions & config
│   └── functions/
│       └── analyze-crop.ts
├── public/                      # Static assets & web icons
├── src/
│   ├── assets/                  # Sample crop images & farm backgrounds
│   ├── components/
│   │   ├── Background.tsx       # Dynamic animated farm theme background
│   │   ├── LoadingState.tsx     # Animated analysis loader with tips
│   │   └── ResultDashboard.tsx  # Diagnosis cards, action plans & voice summary
│   ├── App.tsx                  # Main application orchestrator & camera logic
│   ├── index.css                # Global styling & Tailwind v4 theme
│   ├── main.tsx                 # React entrypoint
│   └── types.ts                 # TypeScript interfaces for agricultural schema
├── .env.example                 # Environment variables template
├── .gitignore                   # Safe repository ignore list
├── index.html                   # HTML5 template
├── metadata.json                # Project metadata
├── netlify.toml                 # Netlify deployment configuration
├── package.json                 # Project dependencies & scripts
├── server.ts                    # Local Express development server
├── tsconfig.json                # TypeScript configuration
├── vercel.json                  # Vercel serverless routes & headers configuration
└── vite.config.ts               # Vite bundler configuration
```

---

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- A **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/hasim2006/Khet-Doctor.git
cd Khet-Doctor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` to create `.env`:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API Key:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

>  **Note:** You can also enter your Gemini API Key directly in the web app UI using the ** API Key** button in the header if you prefer not to store it in `.env`.

### 4. Run Development Server

```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## ️ Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub (see instructions below).
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `Khet-Doctor` repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = `your_gemini_api_key`
5. Click **Deploy**!

---

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/hasim2006/Khet-Doctor/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Disclaimer

*Khet Doctor AI provides preliminary diagnostic assessments generated by artificial intelligence. While it is trained on extensive agronomic data, real-world factors such as microclimates and soil conditions can vary. For severe or large-scale crop issues, please consult with certified local agricultural extension officers or Krishi Vigyan Kendra (KVK) experts before applying heavy chemical treatments.*

---

<div align="center">

Made with ️ for Indian Farmers 

**[Try the Live Web App](https://khet-doctor-ai.vercel.app/)**

</div>
