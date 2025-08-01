import { schema, OutputType } from "./details_GET.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Documents, DocumentFields, DocumentReviews } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const { documentId } = schema.parse({
      documentId: url.searchParams.get('documentId'),
    });

    const document = await db
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', documentId)
      .executeTakeFirst();

    if (!document) {
      return new Response(superjson.stringify({ error: "Document not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fields = await db
      .selectFrom('documentFields')
      .selectAll()
      .where('documentId', '=', documentId)
      .orderBy('fieldName', 'asc')
      .execute();

    const reviews = await db
      .selectFrom('documentReviews')
      .selectAll()
      .where('documentId', '=', documentId)
      .orderBy('createdAt', 'desc')
      .execute();

    const output: OutputType = {
      document,
      fields,
      reviews,
    };

    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching document details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}