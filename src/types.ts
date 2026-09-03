export interface AdditionalInsights {
  disease_type: string;
  favorable_conditions: string;
  spread_mechanism: string;
  potential_impact: string;
  early_warning_signs: string;
  prevention: string;
}

export interface AnalysisResult {
  crop: string;
  possible_problem: string;
  confidence: number;
  severity: string;
  visible_symptoms: string[];
  possible_causes: string[];
  alternative_possibilities: string[];
  follow_up_questions: string[];
  immediate_actions: string[];
  next_2_3_days: string[];
  things_to_avoid: string[];
  worsening_signs: string[];
  additional_insights: AdditionalInsights;
  voice_summary: string;
  safety_note: string;
}

export type SupportedLanguage = 
  | "Hindi"
  | "English"
  | "Hinglish"
  | "Punjabi"
  | "Marathi"
  | "Bengali"
  | "Tamil"
  | "Telugu";
