import { z } from "zod";
import superjson from 'superjson';
import { DocumentStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  documentId: z.string().uuid("Invalid document ID format."),
  // We only allow a subset of statuses for manual updates
  status: z.enum(["approved", "rejected", "reviewed"]),
  reviewNotes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  documentId: string;
};

export const postDocumentsStatus = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/documents/status`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = errorObject && typeof errorObject === 'object' && 'error' in errorObject 
      ? String(errorObject.error) 
      : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};