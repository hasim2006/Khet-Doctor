import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageBase64, mimeType, language, context, isFollowUp, previousAnswers } = req.body || {};
    const customApiKey = (req.headers?.["x-gemini-api-key"] as string) || req.body?.apiKey;
    const serverKey = process.env.GEMINI_API_KEY;
    const effectiveApiKey = (customApiKey || serverKey || "").trim();

    if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured. Please click the 🔑 API Key button at the top of the app to enter your Google Gemini API key.",
        code: "MISSING_API_KEY",
      });
    }

    if (effectiveApiKey.startsWith("AQ.")) {
      return res.status(400).json({
        error: "Invalid API key format. The entered key appears to be an OAuth session token ('AQ...'). Google Gemini API keys must start with 'AIzaSy...'. Please get a free key from Google AI Studio (https://aistudio.google.com/apikey) and click the 🔑 Key button in the app.",
        code: "INVALID_KEY_FORMAT",
      });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided. Please take or upload a crop photo." });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
    });

    let promptStr = `You are "Khet Doctor AI" (खेत डॉक्टर), an expert agricultural scientist, agronomist, and farmer-friendly crop doctor.
Your goal is to provide deeply practical, accurate, and easy-to-understand crop diagnosis and action plan for farmers.

Instructions:
1. Analyze the uploaded crop image carefully. Detect the crop species and identify any disease, pest infestation, nutrient deficiency, water stress, or physiological disorder.
2. If the image is blurry, extremely dark, unrelated to crops/plants, or has no visible symptoms, explain politely that a clearer photo of affected leaves, stem, or fruit is required.
3. Keep the advice practical and farmer-first:
   - Provide safe, organic / bio-control remedies first (e.g., Neem oil spray 1500ppm, Trichoderma, cow urine / buttermilk spray, ash dusting, proper weed removal).
   - If chemical treatment is needed, mention standard generic recommendations with safety cautions (wear gloves/mask, do not spray in high wind or before rain).
   - Give actionable advice for TODAY, what to watch for in NEXT 2-3 DAYS, and critical MISTAKES TO AVOID (like excessive urea, over-watering).
4. Write all responses in the requested language: "${language || "Hindi"}".
   - If Hindi: Use natural, conversational Hindi with clear agricultural terms (जैसे: झुलसा रोग, माहू/एफिड्स, पीलापन, नीम का तेल, कवकनाशी).
   - If Hinglish: Use conversational Hinglish easily readable by Indian farmers and youth.
   - If English: Use simple, plain English without unnecessary jargon.
5. Return a valid JSON object strictly matching this schema:

{
  "crop": "Detected crop name (e.g., Wheat / गेहूँ, Tomato / टमाटर)",
  "possible_problem": "Primary suspected disease, pest or deficiency",
  "confidence": 85,
  "severity": "Low" | "Medium" | "High",
  "visible_symptoms": [
    "Symptom 1 observed in the photo",
    "Symptom 2"
  ],
  "possible_causes": [
    "Primary cause (fungus/bacteria/pest/weather/soil)",
    "Secondary environmental factor"
  ],
  "alternative_possibilities": [
    "Other possible issue if symptoms overlap"
  ],
  "follow_up_questions": [
    "2-3 smart questions for farmer (e.g. soil moisture, crop age, recent spray)"
  ],
  "immediate_actions": [
    "Today's urgent action 1 (e.g. isolate affected leaves, stop overhead watering)",
    "Today's organic or safe remedy spray recipe"
  ],
  "next_2_3_days": [
    "Step to monitor in 2-3 days",
    "Next protective measure"
  ],
  "things_to_avoid": [
    "Mistake to avoid 1 (e.g. do not spray during hot afternoon)",
    "Mistake to avoid 2"
  ],
  "worsening_signs": [
    "Warning sign that indicates disease is spreading rapidly",
    "What to do if condition worsens (visit nearest Krishi Vigyan Kendra or call Kisan Helpline 1800-180-1551)"
  ],
  "additional_insights": {
    "disease_type": "Fungal / Bacterial / Viral / Pest / Nutritional",
    "favorable_conditions": "Weather or soil conditions favoring this issue",
    "spread_mechanism": "How it spreads (wind, splashing water, insects)",
    "potential_impact": "Impact on crop yield if left untreated",
    "early_warning_signs": "Early indicators to watch for in future seasons",
    "prevention": "Preventive practices for next planting cycle"
  },
  "voice_summary": "Friendly, encouraging 25-35 second spoken summary. Start with a warm greeting (नमस्ते किसान भाई/Farmer), explain the diagnosed issue in 1 sentence, give the top 2 urgent steps, mention 1 thing to avoid, and reassure them. Keep it natural for voice read-aloud.",
  "safety_note": "यह AI-आधारित प्राथमिक सलाह है। गंभीर स्थिति में अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से संपर्क करें। किसान कॉल सेंटर: 1800-180-1551"
}`;

    if (context) {
      promptStr += `\n\nAdditional Context from Farmer: ${context}`;
    }

    if (isFollowUp && previousAnswers) {
      promptStr += `\n\nFarmer answers to previous follow-up questions: ${JSON.stringify(previousAnswers)}\nPlease adjust diagnosis and recommendations accordingly.`;
    }

    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
    ].filter(Boolean) as string[];

    let response: any = null;
    let lastError: any = null;

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
            { text: promptStr },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Failed to generate diagnosis with available AI models.");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(response.text);
    } catch {
      const cleaned = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    }

    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("Error in Vercel function calling Gemini API:", error);
    let message = error.message || "Failed to analyze crop.";
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        message = parsed.error.message;
      }
    } catch {}

    if (
      message.includes("API_KEY_INVALID") ||
      message.includes("invalid authentication credentials") ||
      message.includes("API key not valid")
    ) {
      message = "Invalid Google Gemini API Key. Please verify your API key starts with 'AIzaSy...' from Google AI Studio (https://aistudio.google.com/apikey).";
    } else if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      message = "Google Gemini request quota temporarily reached. Please try again in 1 minute.";
    }

    return res.status(500).json({ error: message });
  }
}
