import { z } from "zod";
import superjson from 'superjson';
import { DocumentStatusArrayValues, DocumentTypeArrayValues } from "../helpers/schema";
import type { Selectable } from "kysely";
import type { Documents } from "../helpers/schema";

export const schema = z.object({
  id: z.string(),
  projectName: z.string().optional(),
  installerCompany: z.string().optional(),
  documentType: z.enum(DocumentTypeArrayValues).optional(),
  status: z.enum(DocumentStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Documents>;

export const postDocuments = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/documents`, {
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
    const errorMessage = (errorObject && typeof errorObject === 'object' && 'error' in errorObject && typeof errorObject.error === 'string') 
      ? errorObject.error 
      : "Failed to update document";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await result.text());
};