import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postDocumentsResolveError, InputType } from "../endpoints/documents/resolve-error_POST.schema";

export const useResolveDocumentError = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postDocumentsResolveError(data),
    onSuccess: () => {
      toast.success("Document error resolved successfully!");
      // Invalidate queries related to document errors to refetch the updated data.
      // For example, if there's a query for a specific document's details which includes errors.
      queryClient.invalidateQueries({ queryKey: ['documentDetails'] });
      queryClient.invalidateQueries({ queryKey: ['documentErrors'] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resolve document error. Please try again.");
      console.error("Failed to resolve document error:", error);
    },
  });
};