import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

interface NarrativeRequestBody {
  employeeName: string;
  currentRole: string;
  targetRole: string;
  matchPercent: number | null;
  heldSkills: Array<{ name: string; tag: string; source: string }>;
  gaps: Array<{ name: string; reason?: string }>;
  evidenceRows: Array<{
    stage: string;
    sentence: string;
    sourceTab: string;
    date: string;
  }>;
  engagementAction?: {
    action: string;
    owner: string;
    dueDate: string;
    status: string;
    isOverdue: boolean;
  } | null;
}

app.post("/api/recommendations/narrative", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured; falling back to local templates.",
    });
  }

  const body = req.body as NarrativeRequestBody;
  if (!body || !body.employeeName || !body.targetRole) {
    return res.status(400).json({ error: "Missing required employee evidence payload." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const evidenceSummary = body.evidenceRows
      .map((row) => `[${row.stage} | ${row.sourceTab} | ${row.date}] ${row.sentence}`)
      .join("\n");

    const engagementLine = body.engagementAction
      ? `Open/Overdue Engagement Action: "${body.engagementAction.action}" (Owner: ${body.engagementAction.owner}, Due: ${body.engagementAction.dueDate}, Status: ${body.engagementAction.status}${body.engagementAction.isOverdue ? " - OVERDUE" : ""}).`
      : "No open or overdue engagement action.";

    const prompt = `You are writing an HR & Manager career-support brief for Journey360 ("AI suggests. You choose. Managers and HR support.").
The employee chooses whether to explore a suggested path, and managers and HR support them. Never say a manager "approves" or "decides" the move.
Use ONLY the factual evidence rows provided below. Do NOT invent skills, dates, metrics, or scores. Never mention pay, compensation, wellbeing, absence, exit-risk, or engagement scores.

Employee: ${body.employeeName}
Current Role (Master): ${body.currentRole}
Target Role (Career Aspiration): ${body.targetRole}
Deterministic Match Score: ${body.matchPercent !== null ? `${body.matchPercent}%` : "No role profile yet, score not available"}
Held Skills: ${body.heldSkills.map((s) => `${s.name} (${s.tag})`).join(", ") || "None matched"}
Skill Gaps: ${body.gaps.map((g) => g.name + (g.reason ? ` (${g.reason})` : "")).join(", ") || "None"}
${engagementLine}

Evidence Rows:
${evidenceSummary}

Produce:
1. "whyRecommendation": 2 concise, evidence-grounded sentences explaining why this path is suggested for the employee to consider and what skill gaps exist.
2. "conversationQuestions": exactly 3 practical, open-ended questions for a supportive 1:1 growth conversation grounded in the evidence above.
3. "suggestedActions": 3 concrete ways the manager and HR can support the employee (if an open or overdue Engagement Action is listed above, explicitly include that action and its due date).`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a factual career-support writer. The employee chooses their path and managers/HR support them—never say a manager approves or decides a move. Only cite evidence explicitly given in the prompt. Keep tone concise, supportive, and objective.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whyRecommendation: {
              type: Type.STRING,
              description: "2 concise sentences explaining why this path is suggested based solely on evidence.",
            },
            conversationQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 supportive growth conversation questions grounded in the evidence.",
            },
            suggestedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 concrete support actions including any open/overdue engagement action and its due date.",
            },
          },
          required: ["whyRecommendation", "conversationQuestions", "suggestedActions"],
        },
      },
    });

    const text = (response.text ?? "").trim();
    if (!text) {
      return res.status(502).json({ error: "Empty response from Gemini model." });
    }

    const parsed = JSON.parse(text);
    return res.json({
      source: "gemini",
      whyRecommendation: String(parsed.whyRecommendation || ""),
      conversationQuestions: Array.isArray(parsed.conversationQuestions)
        ? parsed.conversationQuestions.slice(0, 3).map(String)
        : [],
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions.slice(0, 4).map(String)
        : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate Gemini narrative.";
    return res.status(502).json({ error: message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*all", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Journey360 server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
