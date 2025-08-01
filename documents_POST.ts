import { db } from "../helpers/db";
import { schema, OutputType } from "./documents_POST.schema";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Documents } from "../helpers/schema";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { id, ...updateData } = input;

    if (Object.keys(updateData).length === 0) {
      return new Response(superjson.stringify({ error: "No fields to update provided." }), { status: 400 });
    }

    const updatedDocument = await db
      .updateTable("documents")
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedDocument satisfies OutputType));
  } catch (error) {
    console.error("Error updating document:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}