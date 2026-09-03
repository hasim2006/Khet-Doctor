import React, { useState, useEffect } from 'react';
import { AnalysisResult, SupportedLanguage } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  result: AnalysisResult;
  language: SupportedLanguage;
  isAnalyzing: boolean;
  onAnswerSubmit: (answers: Record<string, string>) => void;
}

export default function ResultDashboard({ result, language, isAnalyzing, onAnswerSubmit }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayVoice = () => {
    if (!speechSynthesis) return;

    if (isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        const u = new SpeechSynthesisUtterance(result.voice_summary);
        u.lang = language === 'English' ? 'en-US' : 'hi-IN'; // Extend mappings for other languages if needed
        u.onend = () => setIsPlaying(false);
        u.onerror = () => setIsPlaying(false);
        setUtterance(u);
        speechSynthesis.speak(u);
        setIsPlaying(true);
      }
    }
  };

  const handleReplay = () => {
    if (!speechSynthesis || !utterance) return;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Voice Summary Player */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/40 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">🔊 Listen to Summary</h4>
          <p className="text-xs text-gray-500 font-medium">Hear a quick overview of the assessment.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePlayVoice}
            className="w-12 h-12 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md transition-transform active:scale-95"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>
          {utterance && (
            <button 
              onClick={handleReplay}
              className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-sm transition-transform active:scale-95"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Diagnosis Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/40">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🌾 Crop Detected</p>
              <h3 className="text-xl font-extrabold text-gray-900">{result.crop}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence</p>
              <div className="inline-flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${result.confidence > 75 ? 'bg-green-500' : result.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">{result.confidence}%</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🔍 AI Diagnosis Result</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">{result.possible_problem}</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              result.severity === 'High' ? 'bg-red-100 text-red-700' :
              result.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              Severity: {result.severity}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">👀 Visible Symptoms</p>
              <ul className="space-y-2">
                {result.visible_symptoms.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🤔 Possible Causes</p>
              <ul className="space-y-2">
                {result.possible_causes.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={24} />
            What You Should Do
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Today */}
          <div>
            <p className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              📅 Today
            </p>
            <ul className="space-y-2">
              {result.immediate_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 bg-green-50/50 p-3 rounded-lg border border-green-100 text-sm text-gray-800 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Next 2-3 Days */}
          <div>
            <p className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              ⏳ Next 2-3 Days
            </p>
            <ul className="space-y-2">
              {result.next_2_3_days.map((action, i) => (
                <li key={i} className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm text-gray-800 font-medium">
                  <span className="text-blue-600 font-bold mt-0.5">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Worsening Signs */}
          <div>
            <p className="text-sm font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              📉 If Condition Gets Worse
            </p>
            <ul className="space-y-2">
              {result.worsening_signs.map((sign, i) => (
                <li key={i} className="flex items-start gap-3 bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-sm text-gray-800 font-medium">
                  <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  {sign}
                </li>
              ))}
            </ul>
          </div>

          {/* What to Avoid */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              🚫 What To Avoid
            </p>
            <ul className="space-y-2">
              {result.things_to_avoid.map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-900 font-medium">
                  <span className="text-red-500 font-bold mt-0.5">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      {result.additional_insights && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 p-6">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Info size={22} className="text-blue-500" />
            Additional Insights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Disease Type", value: result.additional_insights.disease_type },
              { label: "Spread Via", value: result.additional_insights.spread_mechanism },
              { label: "Potential Impact", value: result.additional_insights.potential_impact },
              { label: "Favorable Conditions", value: result.additional_insights.favorable_conditions, colSpan: 2 },
              { label: "Prevention", value: result.additional_insights.prevention, colSpan: 2 },
            ].map((insight, idx) => (
              <div key={idx} className={`bg-gray-50 rounded-xl p-3 border border-gray-100 ${insight.colSpan ? 'col-span-2' : ''}`}>
                <p className="text-xs font-bold text-gray-500 uppercase">{insight.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{insight.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Follow Up */}
      {result.follow_up_questions && result.follow_up_questions.length > 0 && (
        <div className="bg-blue-600/90 backdrop-blur-md rounded-2xl p-6 border border-blue-400 shadow-lg text-white">
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
            Help improve this diagnosis
          </h4>
          <p className="text-sm text-blue-100 mb-4">Answering these helps AI provide better advice:</p>
          <ul className="space-y-3 mb-5">
            {result.follow_up_questions.map((q, i) => (
              <li key={i} className="text-sm font-medium bg-blue-700/50 p-3 rounded-lg border border-blue-500/50 flex flex-col gap-2">
                <span>{q}</span>
                {isAnswering && (
                  <input
                    type="text"
                    className="w-full bg-white text-gray-800 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type your answer here..."
                    value={answers[q] || ''}
                    onChange={(e) => setAnswers({...answers, [q]: e.target.value})}
                  />
                )}
              </li>
            ))}
          </ul>
          {!isAnswering ? (
            <button 
              onClick={() => setIsAnswering(true)}
              className="bg-white text-blue-700 text-sm font-bold py-3 px-6 rounded-xl shadow-md hover:bg-blue-50 transition-colors w-full"
            >
              Answer Questions
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAnswering(false)}
                className="bg-blue-500/50 text-white text-sm font-bold py-3 px-6 rounded-xl shadow-md hover:bg-blue-500 transition-colors flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onAnswerSubmit(answers);
                  setIsAnswering(false);
                }}
                disabled={isAnalyzing}
                className="bg-white text-blue-700 text-sm font-bold py-3 px-6 rounded-xl shadow-md hover:bg-blue-50 transition-colors flex-1 disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Submit Answers'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Safety Note */}
      <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
        <ShieldAlert className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
          {result.safety_note}
        </p>
      </div>

    </motion.div>
  );
}
