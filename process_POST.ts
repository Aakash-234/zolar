import { db } from "../../helpers/db";
import { schema, OutputType } from "./process_POST.schema";
import { processDocumentWithAI } from "../../helpers/documentProcessor";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function updateDocumentStatus(documentId: string, status: 'processing' | 'reviewed' | 'rejected', trx: Transaction<DB>) {
  return trx
    .updateTable('documents')
    .set({ status, updatedAt: new Date() })
    .where('id', '=', documentId)
    .execute();
}

export async function handle(request: Request) {
  let validatedDocumentId: string | undefined; // For error handling in catch block
  
  try {
    // Read the request body once and store it
    const requestText = await request.text();
    
    // Handle empty request body
    if (!requestText.trim()) {
      return new Response(superjson.stringify({ error: "Request body is empty" }), { status: 400 });
    }

    // Parse JSON and validate schema
    let parsedBody;
    try {
      parsedBody = superjson.parse(requestText);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(superjson.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
    }

    // Validate the parsed body against schema
    const validationResult = schema.safeParse(parsedBody);
    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return new Response(superjson.stringify({ error: validationResult.error.message }), { status: 400 });
    }

    const documentId = validationResult.data.documentId;
    validatedDocumentId = documentId; // Store for error handling

    // Ensure documentId is defined after validation
    if (!documentId) {
      return new Response(superjson.stringify({ error: "Document ID is required" }), { status: 400 });
    }

    const document = await db
      .selectFrom('documents')
      .select(['id', 'fileUrl', 'documentType', 'status'])
      .where('id', '=', documentId)
      .executeTakeFirst();

    if (!document) {
      return new Response(superjson.stringify({ error: `Document with ID ${documentId} not found.` }), { status: 404 });
    }

    if (!document.fileUrl) {
        return new Response(superjson.stringify({ error: `Document with ID ${documentId} has no file URL.` }), { status: 400 });
    }

    await db.transaction().execute(async (trx) => {
        await updateDocumentStatus(documentId, 'processing', trx);
    });

    const extractedData = await processDocumentWithAI(document.fileUrl, document.documentType);

    await db.transaction().execute(async (trx) => {
        // Clear existing fields for this document to avoid duplicates on re-processing
        await trx
            .deleteFrom('documentFields')
            .where('documentId', '=', documentId)
            .execute();

        if (extractedData.length > 0) {
            const fieldsToInsert = extractedData.map(field => ({
                documentId: document.id,
                fieldName: field.fieldName,
                fieldValue: field.fieldValue,
                confidenceScore: field.confidenceScore,
                validationNotes: field.validationNotes,
                isValidated: false, // Requires manual review
            }));
            await trx.insertInto('documentFields').values(fieldsToInsert).execute();
        }
        
        await updateDocumentStatus(documentId, 'reviewed', trx);
        await trx.updateTable('documents').set({ reviewedAt: new Date() }).where('id', '=', documentId).execute();
    });

    const response: OutputType = {
        documentId: document.id,
        fields: extractedData,
    };

    return new Response(superjson.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing document:", error);
    
        // Attempt to update status to rejected if we have a documentId and an error occurs
    if (validatedDocumentId) {
      try {
        await db.transaction().execute(async (trx) => {
          await updateDocumentStatus(validatedDocumentId as string, 'rejected', trx);
        });
      } catch (statusUpdateError) {
        console.error("Failed to update document status to rejected:", statusUpdateError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}