import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { EXTRACTION_PROMPT } from "./extraction-prompt";
import { ExtractionResponse } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface DocumentInput {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Extract data from one or more OR/CR document images.
 * Supports single combined OR/CR image, or separate OR + CR files.
 */
export async function extractFromDocument(
  ...documents: DocumentInput[]
): Promise<ExtractionResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const parts: (string | Part)[] = [EXTRACTION_PROMPT];

  if (documents.length === 1) {
    parts.push({
      inlineData: {
        data: documents[0].buffer.toString("base64"),
        mimeType: documents[0].mimeType,
      },
    });
  } else {
    // Multiple files — label each one so Gemini knows which is which
    parts.push("\n\nDocument 1 (this may be the OR or the CR — identify which one it is and extract accordingly):");
    parts.push({
      inlineData: {
        data: documents[0].buffer.toString("base64"),
        mimeType: documents[0].mimeType,
      },
    });
    parts.push("\n\nDocument 2 (this may be the OR or the CR — identify which one it is and extract accordingly):");
    parts.push({
      inlineData: {
        data: documents[1].buffer.toString("base64"),
        mimeType: documents[1].mimeType,
      },
    });
    if (documents.length > 2) {
      for (let i = 2; i < documents.length; i++) {
        parts.push(`\n\nDocument ${i + 1}:`);
        parts.push({
          inlineData: {
            data: documents[i].buffer.toString("base64"),
            mimeType: documents[i].mimeType,
          },
        });
      }
    }
    parts.push("\n\nCombine information from ALL documents above into a single extraction. Cross-reference fields between OR and CR for maximum accuracy.");
  }

  const result = await model.generateContent(parts);
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
