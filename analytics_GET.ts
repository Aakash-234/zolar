import { schema, OutputType } from "./analytics_GET.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';
import { DocumentStatus } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    // No input to validate for this GET request
    schema.parse({});

    const statusCountResult = await db
      .selectFrom('documents')
      .select(['status', db.fn.count('id').as('count')])
      .where('status', 'is not', null)
      .groupBy('status')
      .execute();

    const statusCounts = statusCountResult.reduce((acc, row) => {
      if (row.status) {
        // The count from db.fn.count is a string or bigint, so we parse it.
        acc[row.status] = parseInt(String(row.count), 10);
      }
      return acc;
    }, {} as Record<DocumentStatus, number>);

    const recentActivity = await db
      .selectFrom('documents')
      .selectAll()
      .orderBy('updatedAt', 'desc')
      .limit(5)
      .execute();

    const output: OutputType = {
      statusCounts,
      recentActivity,
    };

    return new Response(superjson.stringify(output), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching document analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}