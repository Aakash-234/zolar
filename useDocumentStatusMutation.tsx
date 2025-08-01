import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postDocumentsStatus, InputType } from "../endpoints/documents/status_POST.schema";
import { toast } from "sonner";

export const useDocumentStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postDocumentsStatus(data),
    onSuccess: (data) => {
      toast.success(`Document status updated successfully.`);
      // Invalidate queries to refetch data and update the UI
      queryClient.invalidateQueries({ queryKey: ["documentDetails", data.documentId] });
      queryClient.invalidateQueries({ queryKey: ["documentAnalytics"] });
      // Potentially invalidate a list of documents if one exists
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
};