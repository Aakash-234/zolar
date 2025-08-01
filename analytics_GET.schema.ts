import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Documents, DocumentStatus, DocumentStatusArrayValues } from "../../helpers/schema";

// No input schema needed for this endpoint
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  statusCounts: Record<DocumentStatus, number>;
  recentActivity: Selectable<Documents>[];
};

export const getDocumentsAnalytics = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/documents/analytics`, {
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