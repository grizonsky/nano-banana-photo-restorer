
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function callGeminiForImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageUrl: string; mimeType: string } | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Handle cases where the prompt was blocked or no candidates were returned.
    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt or image.`);
      }
      throw new Error("The model did not return any content. Please try a different prompt.");
    }
    
    const candidate = response.candidates[0];
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const restoredBase64 = imagePart.inlineData.data;
      const restoredMimeType = imagePart.inlineData.mimeType;
      return {
        imageUrl: `data:${restoredMimeType};base64,${restoredBase64}`,
        mimeType: restoredMimeType,
      };
    }
    
    // If no image is found, check for a text response to provide a more specific error.
    const textResponse = response.text.trim();
    if (textResponse) {
      throw new Error(`Model returned text instead of an image: "${textResponse}"`);
    }

    // This is a fallback. The user will see the generic "did not return an image" message from App.tsx.
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error(`QUOTA_EXCEEDED: You have exceeded your API quota. To prevent further errors, the process button will be disabled for 60 seconds.`);
        }
        // Let our custom, more informative errors pass through without being re-wrapped.
        if (error.message.startsWith('Request was blocked') || 
            error.message.startsWith('The model did not return') || 
            error.message.startsWith('Model returned text')) {
            throw error;
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

export function restorePhoto(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageUrl: string; mimeType: string } | null> {
  return callGeminiForImage(base64ImageData, mimeType, prompt);
}