import { GoogleGenAI, Type } from "@google/genai";
import { Template, Variable, Step } from "../types";

// Helper to create a safe ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to ensure value is string. 
// React Error #31 happens if we try to render an object.
const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  // If it's an object/array, we generally want to discard it for text fields 
  // or flatten it to avoid crashes, but empty string is safest for UI text.
  return '';
};

export const generateTemplateWithAI = async (prompt: string): Promise<Template> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      You are an expert workflow architect. 
      Your goal is to create structured workflow templates based on user requests.
      A workflow consists of a Name, Description, a list of Steps, and a list of Default Variables.
      
      Variables are crucial. They represent information captured once and reused.
      Example: For a webinar, "Webinar Title" and "Date" are variables.
      
      Return a JSON object matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a detailed workflow template for: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            defaultVariables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING, description: "A short machine-readable key, e.g., 'webinarName'" },
                  label: { type: Type.STRING, description: "Human readable label, e.g., 'Webinar Name'" },
                  description: { type: Type.STRING, description: "Helper text for what to enter" },
                  value: { type: Type.STRING, description: "Leave empty, this is default" }
                },
                required: ["key", "label", "value"]
              }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING, description: "Detailed instructions. Use {{key}} to reference variables." },
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["name", "description", "defaultVariables", "steps"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Transform to internal type with IDs and sanitization
    const template: Template = {
      id: generateId(),
      name: safeString(result.name) || 'Untitled Workflow',
      description: safeString(result.description),
      defaultVariables: Array.isArray(result.defaultVariables) ? result.defaultVariables.map((v: any) => ({ 
        key: safeString(v.key),
        label: safeString(v.label),
        description: safeString(v.description),
        value: '' // Ensure value is initialized as string
      })) : [],
      steps: Array.isArray(result.steps) ? result.steps.map((s: any) => ({ 
        id: generateId(), 
        title: safeString(s.title) || 'Untitled Step',
        description: safeString(s.description),
        completed: false 
      })) : []
    };

    return template;

  } catch (error) {
    console.error("Failed to generate template:", error);
    throw new Error("Could not generate template from AI. Please try again.");
  }
};