import { db } from "../helpers/db";
import { schema, OutputType } from "./documents_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse(queryParams);

    const { page = 1, pageSize = 10, status, documentType, searchQuery } = input;
    const offset = (page - 1) * pageSize;

    let query = db.selectFrom("documents");
    let countQuery = db.selectFrom("documents").select(db.fn.count("id").as("count"));

    if (status) {
      query = query.where("status", "=", status);
      countQuery = countQuery.where("status", "=", status);
    }
    if (documentType) {
      query = query.where("documentType", "=", documentType);
      countQuery = countQuery.where("documentType", "=", documentType);
    }
    if (searchQuery) {
      const searchTerm = `%${searchQuery}%`;
      query = query.where((eb) =>
        eb.or([
          eb("projectName", "ilike", searchTerm),
          eb("installerCompany", "ilike", searchTerm),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("projectName", "ilike", searchTerm),
          eb("installerCompany", "ilike", searchTerm),
        ])
      );
    }

    const documents = await query
      .selectAll()
      .orderBy("uploadedAt", "desc")
      .limit(pageSize)
      .offset(offset)
      .execute();

    const totalResult = await countQuery.executeTakeFirst();
    const totalCount = Number(totalResult?.count ?? 0);

    const response: OutputType = {
      documents,
      totalCount,
      page,
      pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    console.error("Error fetching documents:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}