import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const steps = [
  "Identifying crop...",
  "Examining symptoms...",
  "Checking possible causes...",
  "Estimating severity...",
  "Preparing action plan..."
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Step through the loading messages purely for UX effect
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-green-900 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg">
      <Loader2 size={40} className="animate-spin mb-4 text-green-700" />
      <h3 className="font-bold text-xl mb-6">🌱 Looking at your crop...</h3>
      
      <div className="space-y-3 w-full max-w-xs text-left">
        <AnimatePresence>
          {steps.map((step, index) => {
            if (index > currentStep) return null;
            const isCurrent = index === currentStep;
            
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={20} className="text-green-600" />
                )}
                <span className={`text-sm font-medium ${isCurrent ? 'text-green-800' : 'text-green-700/70'}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
