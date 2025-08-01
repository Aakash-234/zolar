import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Documents, DocumentFields, DocumentReviews } from "../../helpers/schema";

export const schema = z.object({
  documentId: z.string().uuid("Invalid document ID format."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  document: Selectable<Documents>;
  fields: Selectable<DocumentFields>[];
  reviews: Selectable<DocumentReviews>[];
};

export const getDocumentsDetails = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams({
    documentId: validatedParams.documentId,
  });

  const result = await fetch(`/_api/documents/details?${searchParams.toString()}`, {
    method: "GET",
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