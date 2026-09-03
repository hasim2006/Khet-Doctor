import { GoogleGenAI, Type } from "@google/genai";

export async function handler(event: any) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-gemini-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { imageBase64, mimeType, language, context, isFollowUp, previousAnswers } = body;
    const customApiKey = event.headers?.["x-gemini-api-key"] || body.apiKey;
    const effectiveApiKey = (customApiKey || process.env.GEMINI_API_KEY || "").trim();

    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Gemini API key is not configured.",
        }),
      };
    }

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No image provided." }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let promptStr = `You are Khet Doctor AI, an expert agricultural AI assistant.
Your task is to analyze a crop photo and provide a simple, practical, farmer-friendly assessment.
If the image is blurry, extremely dark, unrelated to plants, or shows no visible symptoms, explicitly state that more information is needed and do not guarantee a diagnosis. Do not blindly recommend unsafe pesticides or specific chemical dosages.

Return a structured JSON response exactly matching this schema. Write all text responses in ${language || "English"}.

Never present an image-based diagnosis as 100% certain. Use language such as "Likely", "Possible", "Based on visible symptoms".

Schema details:
- crop: string (Detected crop name)
- possible_problem: string (The suspected disease, pest, nutrient deficiency, etc.)
- confidence: number (0 to 100)
- severity: string ("Low", "Medium", "High")
- visible_symptoms: array of strings
- possible_causes: array of strings
- alternative_possibilities: array of strings
- follow_up_questions: array of 2 to 4 smart follow-up questions to improve assessment (e.g. crop age, location, weather)
- immediate_actions: array of strings (Action plan for TODAY)
- next_2_3_days: array of strings (What to monitor in the next 2-3 days)
- things_to_avoid: array of strings (What NOT to do)
- worsening_signs: array of strings (If Condition Gets Worse: Warning signs + recommended next step)
- additional_insights: object containing: disease_type, favorable_conditions, spread_mechanism, potential_impact, early_warning_signs, prevention. Only provide these if reasonably supported by diagnosis.
- voice_summary: string (A SHORT summary to be spoken out loud, 15-30 seconds. Explain the problem, severity, what to do, what to avoid, when to check again. Do NOT read the entire dashboard, sound natural and friendly.)
- safety_note: string (A disclaimer that this is an AI assessment and local verification is needed)
`;

    if (context) {
      promptStr += `\n\nAdditional Context from Farmer (Voice/Text): ${context}`;
    }

    if (isFollowUp && previousAnswers) {
      promptStr += `\n\nThe farmer has answered some follow-up questions: ${JSON.stringify(previousAnswers)}\nPlease adjust your diagnosis and action plan accordingly.`;
    }

    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ].filter(Boolean) as string[];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              { text: promptStr },
              {
                inlineData: {
                  data: imageBase64.split(",")[1] || imageBase64,
                  mimeType: mimeType || "image/jpeg",
                },
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                crop: { type: Type.STRING },
                possible_problem: { type: Type.STRING },
                confidence: { type: Type.INTEGER },
                severity: { type: Type.STRING },
                visible_symptoms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                possible_causes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                alternative_possibilities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                follow_up_questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                immediate_actions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                next_2_3_days: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                things_to_avoid: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                worsening_signs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                additional_insights: {
                  type: Type.OBJECT,
                  properties: {
                    disease_type: { type: Type.STRING },
                    favorable_conditions: { type: Type.STRING },
                    spread_mechanism: { type: Type.STRING },
                    potential_impact: { type: Type.STRING },
                    early_warning_signs: { type: Type.STRING },
                    prevention: { type: Type.STRING },
                  },
                  required: ["disease_type", "favorable_conditions", "spread_mechanism", "potential_impact", "early_warning_signs", "prevention"],
                },
                voice_summary: { type: Type.STRING },
                safety_note: { type: Type.STRING },
              },
              required: [
                "crop",
                "possible_problem",
                "confidence",
                "severity",
                "visible_symptoms",
                "possible_causes",
                "alternative_possibilities",
                "follow_up_questions",
                "immediate_actions",
                "next_2_3_days",
                "things_to_avoid",
                "worsening_signs",
                "additional_insights",
                "voice_summary",
                "safety_note",
              ],
            },
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Netlify model ${model} failed, attempting next model...`, err.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Failed to generate diagnosis with available AI models.");
    }

    return {
      statusCode: 200,
      headers,
      body: response.text || "{}",
    };
  } catch (error: any) {
    console.error("Error in Netlify function calling Gemini API:", error);
    let message = error.message || "Failed to analyze crop.";
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        message = parsed.error.message;
      }
    } catch {}

    if (message.includes("Method doesn't allow unregistered callers") || message.includes("API Key or other form of API consumer identity")) {
      message = "Invalid or missing Gemini API Key. Please configure GEMINI_API_KEY in your Netlify site environment variables.";
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
}
