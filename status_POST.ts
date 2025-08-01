import { schema, OutputType } from "./status_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function updateDocumentStatus(
  trx: Transaction<DB>,
  documentId: string,
  status: 'approved' | 'rejected' | 'reviewed',
  reviewNotes?: string | null
) {
  // Update document status and reviewedAt timestamp
  const updatedDocument = await trx
    .updateTable('documents')
    .set({
      status: status,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where('id', '=', documentId)
    .returning('id')
    .executeTakeFirst();

  if (!updatedDocument) {
    throw new Error("Document not found or failed to update.");
  }

  // Create a review record for audit purposes
  await trx
    .insertInto('documentReviews')
    .values({
      documentId: documentId,
      reviewStatus: status,
      reviewNotes: reviewNotes,
      // Assuming reviewerName will be implemented with authentication later
      reviewerName: 'System', 
      reviewedAt: new Date(),
      createdAt: new Date(),
    })
    .execute();
}


export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { documentId, status, reviewNotes } = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      await updateDocumentStatus(trx, documentId, status, reviewNotes);
    });

    const output: OutputType = { success: true, documentId };
    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}