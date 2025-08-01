import { db } from "../../helpers/db";
import { schema, OutputType } from "./upload_POST.schema";
import superjson from 'superjson';

// Helper to convert a file to a base64 data URL
const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
};

export async function handle(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const result = schema.safeParse({
      file: formData.get("file"),
      projectName: formData.get("projectName"),
      installerCompany: formData.get("installerCompany"),
      documentType: formData.get("documentType"),
    });

    if (!result.success) {
      // Flatten errors for a more readable response
      const errors = result.error.flatten().fieldErrors;
      console.error("Validation failed:", errors);
      return new Response(superjson.stringify({ error: "Validation failed", details: errors }), { status: 400 });
    }

    const { file, ...metadata } = result.data;

    const fileUrl = await fileToBase64(file);

    const newDocument = {
      ...metadata,
      filename: file.name, // In a real scenario, this would be a sanitized, unique name for storage
      originalFilename: file.name,
      fileUrl,
      status: "pending" as const,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedDocument = await db
      .insertInto("documents")
      .values(newDocument)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(insertedDocument satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error uploading document:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 500 });
  }
}