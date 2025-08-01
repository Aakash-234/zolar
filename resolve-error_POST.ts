import { schema, OutputType } from "./resolve-error_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { errorId } = schema.parse(json);

    const result = await db
      .updateTable('documentErrors')
      .set({ 
        isResolved: true,
        updatedAt: new Date(),
      })
      .where('id', '=', errorId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
      return new Response(superjson.stringify({ error: "Document error not found." }), { status: 404 });
    }

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    console.error("Error resolving document error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}