import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postDocumentsAnalyzeErrors, InputType, OutputType } from '../endpoints/documents/analyze-errors_POST.schema';
import { toast } from 'sonner';

export const useAnalyzeDocumentErrors = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: postDocumentsAnalyzeErrors,
    onSuccess: (data) => {
      toast.success(`Successfully analyzed document. Found ${data.errors.length} potential issues.`);
      // Invalidate queries related to document reviews/errors to refetch the new analysis
      queryClient.invalidateQueries({ queryKey: ['documentErrors', data.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documentReviews', data.documentId] });
    },
    onError: (error) => {
      console.error("Failed to analyze document errors:", error);
      toast.error(error.message || "An unexpected error occurred during analysis.");
    },
  });
};