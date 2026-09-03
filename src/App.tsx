import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, Leaf, RefreshCw, AlertCircle } from 'lucide-react';
import { AnalysisResult, SupportedLanguage } from './types';
import Background from './components/Background';
import LoadingState from './components/LoadingState';
import ResultDashboard from './components/ResultDashboard';
import { motion, AnimatePresence } from 'motion/react';

// Import sample crop images
import wheatImg from './assets/wheat.jpg';
import tomatoImg from './assets/tomato.jpg';
import cottonImg from './assets/cotton.jpg';

const SAMPLE_CROPS = [
  { type: 'wheat', name: 'Wheat', img: wheatImg },
  { type: 'tomato', name: 'Tomato', img: tomatoImg },
  { type: 'cotton', name: 'Cotton', img: cottonImg },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>('Hindi');
  const [voiceContext, setVoiceContext] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API for voice input
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'English' ? 'en-US' : 'hi-IN';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceContext((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setVoiceContext('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Image must be less than 20MB.');
        return;
      }
      setMimeType('image/jpeg');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawUrl = reader.result as string;
        const compressed = await compressImage(rawUrl);
        setSelectedImage(compressed);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDemoSelect = (imgUrl: string) => {
    setSelectedImage(imgUrl);
    setMimeType('image/jpeg');
    setResult(null);
    setError(null);
    setVoiceContext('');
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const analyzeImage = async (followUpAnswers?: Record<string, string>) => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      let rawBase64 = selectedImage;
      if (!selectedImage.startsWith('data:')) {
        rawBase64 = await urlToBase64(selectedImage);
      }
      const base64Data = await compressImage(rawBase64);

      const isFollowUp = !!(followUpAnswers && Object.keys(followUpAnswers).length > 0);

      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          language,
          context: voiceContext,
          isFollowUp,
          previousAnswers: followUpAnswers,
        })
      });

      const textResponse = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(textResponse);
      } catch {
        if (textResponse.includes('FUNCTION_INVOCATION_TIMEOUT') || textResponse.includes('timed out') || textResponse.includes('An error occurred')) {
          throw new Error('AI analysis server took longer than expected. Please try again with a clear photo.');
        }
        throw new Error(textResponse || 'Unexpected response from server.');
      }

      if (!response.ok) {
        let msg = responseData.error || 'Analysis failed.';
        try {
          const parsed = JSON.parse(msg);
          if (parsed.error && parsed.error.message) msg = parsed.error.message;
        } catch {}
        throw new Error(msg);
      }

      setResult(responseData as AnalysisResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 pb-20 relative">
      <Background />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20 border-b border-white/40">
        <div className="flex items-center space-x-2">
          <div className="bg-green-600 p-2 rounded-lg text-white shadow-sm">
            <Leaf size={24} />
          </div>
          <h1 className="text-xl font-bold text-green-900 tracking-tight">Khet Doctor AI</h1>
        </div>
        <div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 focus:ring-2 focus:ring-green-500 font-medium text-gray-800 cursor-pointer hover:bg-white/80 transition-all"
          >
            {["Hindi", "English", "Hinglish", "Punjabi", "Marathi", "Bengali", "Tamil", "Telugu"].map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 relative z-10">
        
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-10 mt-4 bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-white/50 shadow-sm"
            >
              <h2 className="text-3xl font-extrabold text-green-950 mb-3 leading-tight drop-shadow-sm">
                AI ko khet ki photo bhejo <span className="inline-block animate-bounce">🌾</span><br/>
                <span className="text-xl font-bold text-green-800/90 mt-2 block">
                  Woh bataega fasal mein kya problem ho sakti hai.
                </span>
              </h2>
              <p className="text-gray-700 font-medium text-base max-w-sm mx-auto">
                Photo upload karo, AI se crop analysis pao aur simple action plan samjho.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload & Preview Section */}
        <AnimatePresence mode="wait">
          {!result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-6 mb-6"
            >
              {!selectedImage ? (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:scale-95 text-white py-5 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-green-600/30 cursor-pointer"
                  >
                    <Camera size={26} />
                    Take Photo
                  </button>
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-gray-300/50 flex-1"></div>
                    <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">OR</span>
                    <div className="h-px bg-gray-300/50 flex-1"></div>
                  </div>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:scale-95 text-green-800 py-4 rounded-2xl text-lg font-bold transition-all shadow-sm border border-green-100 cursor-pointer"
                  >
                    <Upload size={22} className="text-green-600" />
                    Upload from Gallery
                  </button>

                  <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="relative rounded-2xl overflow-hidden bg-black/5 border border-white/50 aspect-[4/3] mb-5 shadow-inner">
                    <img src={selectedImage} alt="Crop preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => { setSelectedImage(null); setResult(null); setVoiceContext(''); }}
                      className="absolute top-3 right-3 bg-black/40 text-white p-2.5 rounded-full hover:bg-black/60 backdrop-blur-md transition-all shadow-lg active:scale-90 cursor-pointer"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  {!isAnalyzing && (
                    <div className="mb-6 bg-white/60 p-4 rounded-2xl border border-white/60 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Describe the problem 🎙️ (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Gehu ke patte peele ho rahe hain"
                          value={voiceContext}
                          onChange={(e) => setVoiceContext(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner"
                        />
                        <button 
                          onClick={toggleRecording}
                          className={`p-3 rounded-xl flex-shrink-0 transition-all shadow-sm cursor-pointer ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Mic size={22} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAnalyzing ? (
                    <button 
                      onClick={() => analyzeImage()}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-4.5 rounded-2xl text-xl font-black shadow-xl shadow-green-600/30 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Leaf size={24} />
                      Check My Crop 🌱
                    </button>
                  ) : (
                    <LoadingState />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/95 backdrop-blur-md text-red-800 p-4 rounded-2xl border border-red-200 mb-6 text-sm shadow-md flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="font-semibold">{error}</p>
          </motion.div>
        )}

        {/* Demo Mode */}
        <AnimatePresence>
          {!selectedImage && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-8"
            >
              <h3 className="text-xs font-bold text-green-900/60 uppercase tracking-widest mb-4 text-center">Try Sample Crop</h3>
              <div className="grid grid-cols-3 gap-4">
                {SAMPLE_CROPS.map((demo) => (
                  <button
                    key={demo.type}
                    onClick={() => handleDemoSelect(demo.img)}
                    className="flex flex-col items-center bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 hover:bg-white/90 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-3 bg-gray-100 shadow-inner border-2 border-white">
                      <img src={demo.img} alt={demo.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{demo.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {result && <ResultDashboard result={result} language={language} isAnalyzing={isAnalyzing} onAnswerSubmit={(answers) => analyzeImage(answers)} />}
        
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full p-4 text-center z-10 pointer-events-none">
        <span className="bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/20">
          @madewithhasim
        </span>
      </footer>
    </div>
  );
}



