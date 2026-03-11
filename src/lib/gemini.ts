import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXTRACTION_PROMPT } from "./extraction-prompt";
import { ExtractionResponse } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractFromDocument(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ExtractionResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
  const response = result.response;
  const text = response.text();

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
  const jsonStr = jsonMatch[1] || text;

  try {
    const parsed = JSON.parse(jsonStr.trim()) as ExtractionResponse;
    return parsed;
  } catch (e) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${(e as Error).message}`
    );
  }
}
