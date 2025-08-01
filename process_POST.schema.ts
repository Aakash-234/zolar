import { z } from "zod";
import superjson from 'superjson';
import { ExtractedField } from "../../helpers/documentProcessor";

export const schema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  documentId: string;
  fields: ExtractedField[];
};

export const postDocumentsProcess = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/documents/process`, {
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
    const errorMessage = typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject 
      ? String(errorObject.error) 
      : "Failed to process document";
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};