import OpenAI from 'openai';
import { Selectable } from 'kysely';
import { DocumentType, DocumentFields, DocumentErrors, ErrorSeverityLevel } from './schema';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type DocumentError = {
  fieldName: string | null; // null for document-level errors
  errorMessage: string;
  suggestedFix: string;
  severityLevel: ErrorSeverityLevel;
};

const getErrorAnalysisPrompt = (documentType: DocumentType, fields: Selectable<DocumentFields>[]): string => {
  const fieldsJson = JSON.stringify(fields.map(f => ({ fieldName: f.fieldName, fieldValue: f.fieldValue, confidenceScore: f.confidenceScore })), null, 2);

  const commonInstructions = `
You are an expert AI compliance officer for a European clean energy installation company. Your task is to analyze the extracted fields from a document and identify any errors, inconsistencies, or compliance issues.
The user will provide a JSON object of extracted fields.
Analyze these fields based on the document type and common requirements for that document in the European clean energy sector.

Return a JSON object with a key "errors" containing an array of error objects.
Each error object must have the following structure: { "fieldName": "...", "errorMessage": "...", "suggestion": "...", "severity": "..." }.
- 'fieldName': The name of the field with the error. Use null for document-level errors (e.g., multiple missing fields).
- 'errorMessage': A clear and concise description of the error.
- 'suggestedFix': A specific, actionable suggestion for how to fix the error.
- 'severityLevel': The severity of the error, which must be one of 'critical', 'high', 'medium', or 'low'.

If there are no errors, return an empty array: { "errors": [] }.
Do not return any text outside of the JSON object.

Here are the extracted fields:
${fieldsJson}
`;

  const typeSpecificInstructions: Record<DocumentType, string> = {
    homeowner_id: `
Analyze this government-issued ID. Check for:
- Completeness: All fields (fullName, address, idNumber, dateOfBirth, expirationDate) must be present.
- Expiration: The expirationDate must not be in the past.
- Format: dateOfBirth and expirationDate should be valid dates.
- Quality: If confidence scores are low, suggest a better quality image might be needed.
`,
    rebate_form: `
Analyze this rebate form. Check for:
- Completeness: All fields must be filled, especially applicantName, propertyAddress, installationDate, and rebateAmount.
- Signatures: Although not an extracted field, mention if a signature section is likely missing or incomplete based on common forms. Suggest checking for a signature.
- Consistency: The information should be logical (e.g., installationDate should be in the past).
- Format: rebateAmount should be a number. installationDate should be a valid date.
`,
    loan_doc: `
Analyze this loan document. Check for:
- Completeness: Key fields like borrowerName, loanAmount, and lenderName must be present.
- Signatures: The 'isSigned' field is critical. If false, this is a high-severity error.
- Consistency: Check if loan terms seem plausible.
`,
    installation_photo: `
Analyze this installation photo analysis. Check for:
- Critical Issues: The 'obviousIssues' field is most important. If it contains anything other than "No obvious issues," flag it as a high-severity issue.
- Completeness: Ensure equipmentType and location are identified. If brand/model is missing, flag as a low-severity issue.
`,
  };

  return commonInstructions + typeSpecificInstructions[documentType];
};

export async function analyzeDocumentErrors(documentType: DocumentType, fields: Selectable<DocumentFields>[]): Promise<DocumentError[]> {
  try {
    console.log(`Analyzing errors for document type: ${documentType}`);
    if (fields.length === 0) {
      return [{
        fieldName: null,
        errorMessage: "No fields were extracted from this document.",
        suggestedFix: "The document may be empty, unreadable, or the initial processing failed. Please re-process the document or upload a new version.",
        severityLevel: 'high',
      }];
    }

    const prompt = getErrorAnalysisPrompt(documentType, fields);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a smaller, faster model for this logic task
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0].message.content;
    if (!messageContent) {
      throw new Error("OpenAI returned an empty response during error analysis.");
    }

    const parsedJson = JSON.parse(messageContent);
    
    if (!parsedJson.errors || !Array.isArray(parsedJson.errors)) {
      console.error("AI error analysis response was not in the expected format:", parsedJson);
      throw new Error("AI error analysis response was not in the expected format (object with an 'errors' array).");
    }

    return parsedJson.errors.filter((error: any) => 
        typeof error === 'object' && error !== null &&
        'errorMessage' in error &&
        'suggestedFix' in error &&
        'severityLevel' in error
    );

  } catch (error) {
    console.error("Error in analyzeDocumentErrors:", error);
    if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error during error analysis: ${error.status} ${error.name} - ${error.message}`);
    }
    throw error;
  }
}