import { useQuery } from "@tanstack/react-query";
import { getDocumentsDetails } from "../endpoints/documents/details_GET.schema";

export const useDocumentDetails = (documentId: string | null) => {
  return useQuery({
    queryKey: ["documentDetails", documentId],
    queryFn: () => {
      if (!documentId) {
        // React Query's queryFn expects a promise, so we return a rejected one.
        // This prevents the query from running with an invalid ID.
        return Promise.reject(new Error("Document ID is required."));
      }
      return getDocumentsDetails({ documentId });
    },
    enabled: !!documentId, // The query will not run until a documentId is provided.
  });
};