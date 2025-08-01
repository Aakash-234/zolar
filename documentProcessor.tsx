import OpenAI from 'openai';
import { DocumentType } from './schema';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ExtractedField = {
  fieldName: string;
  fieldValue: string | null;
  confidenceScore: number; // 0 to 1
  validationNotes: string | null;
};

const getExtractionPrompt = (documentType: DocumentType): string => {
  const commonInstructions = `
You are an expert AI assistant for a clean energy installation company. Your task is to extract specific fields from the provided document image.
Analyze the image and return a JSON object containing an array of extracted fields.
Each object in the array should have the following structure: { "fieldName": "...", "fieldValue": "...", "confidenceScore": 0.0-1.0, "validationNotes": "..." }.
- 'fieldName': The name of the field being extracted.
- 'fieldValue': The extracted value as a string. If a value cannot be found, use null.
- 'confidenceScore': Your confidence in the accuracy of the extraction, from 0.0 (not confident) to 1.0 (very confident).
- 'validationNotes': Any notes about the extraction, such as if the value is partially obscured, hard to read, or seems unusual. If no notes, use an empty string.

Do not return any text outside of the JSON object.
`;

  const typeSpecificPrompts: Record<DocumentType, string> = {
    homeowner_id: `
Extract the following fields from this government-issued ID:
- "fullName"
- "address"
- "idNumber"
- "dateOfBirth" (in YYYY-MM-DD format)
- "expirationDate" (in YYYY-MM-DD format)
`,
    rebate_form: `
Extract the following fields from this rebate application form:
- "applicantName"
- "propertyAddress"
- "installerCompany"
- "equipmentModel"
- "equipmentSerialNumber"
- "installationDate" (in YYYY-MM-DD format)
- "rebateAmount" (as a number)
`,
    loan_doc: `
Extract the following fields from this loan document:
- "borrowerName"
- "coBorrowerName" (if present)
- "loanAmount" (as a number)
- "interestRate" (as a percentage)
- "loanTerm" (in months or years)
- "lenderName"
- "isSigned" (boolean, true if a signature is visible, false otherwise)
`,
    installation_photo: `
Analyze this installation photo. Extract the following details:
- "equipmentType" (e.g., 'Solar Panel', 'Heat Pump', 'Battery')
- "equipmentBrandAndModel" (if visible on the equipment)
- "location" (e.g., 'Rooftop', 'Basement', 'Exterior Wall')
- "obviousIssues" (Describe any visible damage, incorrect wiring, or other installation problems. If none, state "No obvious issues.")
`,
  };

  return commonInstructions + typeSpecificPrompts[documentType];
};

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${response.status}`);
    }
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${Buffer.from(imageBuffer).toString('base64')}`;
}

export async function processDocumentWithAI(fileUrl: string, documentType: DocumentType): Promise<ExtractedField[]> {
  try {
    console.log(`Processing document type: ${documentType} from URL: ${fileUrl}`);
    const base64Image = await fetchImageAsBase64(fileUrl);
    const prompt = getExtractionPrompt(documentType);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0].message.content;
    if (!messageContent) {
      throw new Error("OpenAI returned an empty response.");
    }

    // The response is expected to be a JSON object with a single key (e.g., "fields") containing the array.
    // We parse it and extract the first value, which should be our array.
    const parsedJson = JSON.parse(messageContent);
    const extractedFields = Object.values(parsedJson)[0];

    if (!Array.isArray(extractedFields)) {
        console.error("Parsed JSON from OpenAI is not in the expected format:", parsedJson);
        throw new Error("AI response was not in the expected format (array of fields).");
    }

    // Basic validation of the returned structure
    return extractedFields.filter(field => 
        typeof field === 'object' &&
        field !== null &&
        'fieldName' in field &&
        'fieldValue' in field &&
        'confidenceScore' in field
    );

  } catch (error) {
    console.error("Error in processDocumentWithAI:", error);
    if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw error; // Re-throw other errors
  }
}