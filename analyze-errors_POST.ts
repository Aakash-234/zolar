import { db } from "../../helpers/db";
import { schema, OutputType } from "./analyze-errors_POST.schema";
import { analyzeDocumentErrors } from "../../helpers/documentErrorAnalyzer";
import superjson from 'superjson';
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validationResult = schema.safeParse(json);

    if (!validationResult.success) {
      return new Response(superjson.stringify({ error: validationResult.error.message }), { status: 400 });
    }

    const { documentId } = validationResult.data;

    const document = await db
      .selectFrom('documents')
      .select(['id', 'documentType'])
      .where('id', '=', documentId)
      .executeTakeFirst();

    if (!document) {
      return new Response(superjson.stringify({ error: `Document with ID ${documentId} not found.` }), { status: 404 });
    }

    const fields = await db
      .selectFrom('documentFields')
      .selectAll()
      .where('documentId', '=', documentId)
      .execute();

    const errors = await analyzeDocumentErrors(document.documentType, fields);

    // Store each error in the document_errors table
    const errorInserts = errors.map(error => ({
      id: nanoid(),
      documentId: document.id,
      fieldName: error.fieldName,
      errorMessage: error.errorMessage,
      suggestedFix: error.suggestedFix,
      severityLevel: error.severityLevel,
      errorType: 'ai_analysis',
      isResolved: false,
    }));

    let insertedErrorIds: string[] = [];
    if (errorInserts.length > 0) {
      const insertedErrors = await db
        .insertInto('documentErrors')
        .values(errorInserts)
        .returning(['id'])
        .execute();
      
      insertedErrorIds = insertedErrors.map(e => e.id);
    }

    const response: OutputType = {
      documentId: document.id,
      reviewId: insertedErrorIds.length > 0 ? insertedErrorIds[0] : nanoid(), // Use first error ID or generate one
      errors: errors,
    };

    return new Response(superjson.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error analyzing document errors:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}