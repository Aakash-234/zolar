import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postDocumentsProcess, InputType } from "../endpoints/documents/process_POST.schema";
import { toast } from "sonner";

export const useProcessDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postDocumentsProcess(data),
    onSuccess: (data) => {
      toast.success(`Document successfully processed.`);
      // Invalidate queries related to the document list and the specific document details
      // to reflect the new status and extracted fields.
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', data.documentId] });
    },
    onError: (error) => {
      console.error("Failed to process document:", error);
      toast.error(error.message || "An unexpected error occurred during document processing.");
    },
  });
};