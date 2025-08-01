import { useQuery } from "@tanstack/react-query";
import { getDocumentsAnalytics } from "../endpoints/documents/analytics_GET.schema";

export const useDocumentAnalytics = () => {
  return useQuery({
    queryKey: ["documentAnalytics"],
    queryFn: () => getDocumentsAnalytics(),
  });
};