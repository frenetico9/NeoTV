
import { GoogleGenAI, Type } from "@google/genai";
import type { Channel, VODItem } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder for development. In a real app, the key should be set in the environment.
  // console.warn("API_KEY environment variable not set for Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

export const getAIRecommendations = async (query: string, channels: Channel[], vodItems: VODItem[]): Promise<any> => {
  if (!process.env.API_KEY && "YOUR_API_KEY_HERE" === "YOUR_API_KEY_HERE") {
      return { 
          reasoning: "API Key not configured. Please add your Gemini API key in `services/geminiService.ts` to enable this feature.",
          recommendations: [] 
      };
  }

  const model = 'gemini-2.5-flash';

  const availableContent = `
    Available Live TV Channels:
    ${channels.map(c => `- ${c.name} (Category: ${c.group})`).join('\n')}

    Available VOD (Video on Demand):
    ${vodItems.map(v => `- ${v.name} (Category: ${v.group}, Genre: ${v.genre.join(', ')})`).join('\n')}
  `;

  const prompt = `
    Based on the following user query and the available content, provide recommendations in JSON format.
    The user query is: "${query}"

    Here is the list of available content:
    ${availableContent}

    Your task is to analyze the user's query and suggest up to 5 relevant items from the content list.
    Provide a brief reasoning for your choices.
    The output must be a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "A brief explanation of why these recommendations were chosen based on the user's query."
            },
            recommendations: {
              type: Type.ARRAY,
              description: "A list of recommended content items.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The type of content, either 'channel' or 'vod'."
                  },
                  name: {
                    type: Type.STRING,
                    description: "The name of the recommended channel or VOD item."
                  },
                  reason: {
                    type: Type.STRING,
                    description: "A short reason why this specific item is a good match."
                  }
                },
                required: ["type", "name", "reason"]
              }
            }
          },
          required: ["reasoning", "recommendations"]
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       return { 
          reasoning: "The provided Gemini API key is invalid. Please check the key in `services/geminiService.ts`.",
          recommendations: [] 
      };
    }
    return {
      reasoning: "Sorry, I couldn't get recommendations at this time. An error occurred.",
      recommendations: []
    };
  }
};
