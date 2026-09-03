import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON requests (for base64 images)
  app.use(express.json({ limit: "50mb" }));

  // API Route to check if server-side API key is configured
  app.get("/api/config", (req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== "" &&
      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    );
    res.json({ hasServerApiKey: hasKey });
  });

  // API Route for analyzing the crop
  app.post("/api/analyze-crop", async (req, res) => {
    try {
      const { imageBase64, mimeType, language, context, isFollowUp, previousAnswers } = req.body;
      const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body.apiKey;
      const effectiveApiKey = (customApiKey || process.env.GEMINI_API_KEY || "").trim();

      if (!effectiveApiKey || effectiveApiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "Gemini API key is not configured. Please add your GEMINI_API_KEY in the .env file or click the Key icon in the app header to enter it.",
          code: "MISSING_API_KEY"
        });
      }

      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided." });
      }

      const ai = new GoogleGenAI({
        apiKey: effectiveApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Base prompt according to user requirements
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
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.1-pro-preview",
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
          console.warn(`Model ${model} failed, attempting next model...`, err.message);
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

      res.json(parsedResult);
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      let message = error.message || "Failed to analyze crop.";
      try {
        const parsed = JSON.parse(message);
        if (parsed.error && parsed.error.message) {
          message = parsed.error.message;
        }
      } catch {}

      if (message.includes("Method doesn't allow unregistered callers") || message.includes("API Key or other form of API consumer identity")) {
        message = "Invalid or missing Gemini API Key. Please provide a valid API key in .env or via the app header key settings.";
      } else if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
        message = "Google Gemini free tier request quota temporarily reached. Please try again in 1 minute.";
      }
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
