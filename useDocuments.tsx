import { useQuery } from "@tanstack/react-query";
import { getDocuments, InputType as GetDocumentsInput } from "../endpoints/documents_GET.schema";

export const documentsQueryKeys = {
  all: ["documents"] as const,
  lists: () => [...documentsQueryKeys.all, "list"] as const,
  list: (filters: GetDocumentsInput) => [...documentsQueryKeys.lists(), filters] as const,
};

export const useDocuments = (filters: GetDocumentsInput) => {
  return useQuery({
    queryKey: documentsQueryKeys.list(filters),
    queryFn: () => getDocuments(filters),
  });
};