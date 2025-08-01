import { z } from "zod";
import superjson from 'superjson';
import { DocumentStatusArrayValues, DocumentTypeArrayValues } from "../helpers/schema";
import type { Selectable } from "kysely";
import type { Documents } from "../helpers/schema";

export const schema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(10),
  status: z.enum(DocumentStatusArrayValues).optional(),
  documentType: z.enum(DocumentTypeArrayValues).optional(),
  searchQuery: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  documents: Selectable<Documents>[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const getDocuments = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();

  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/documents?${searchParams.toString()}`, {
    method: "GET",
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
      : "Failed to fetch documents";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await result.text());
};