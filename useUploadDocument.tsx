import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postDocumentsUpload, InputType as UploadDocumentInput } from "../endpoints/documents/upload_POST.schema";
import { postDocumentsProcess } from "../endpoints/documents/process_POST.schema";
import { documentsQueryKeys } from "./useDocuments";
import { toast } from "sonner";

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadDocumentInput) => postDocumentsUpload(data),
    onSuccess: async (uploadResult) => {
      toast.success("Document uploaded successfully!");
      
      // Invalidate all document list queries to refetch and show the new document
      await queryClient.invalidateQueries({ queryKey: documentsQueryKeys.lists() });
      
      // Automatically trigger processing
      try {
        console.log("Starting automatic document processing...");
        await postDocumentsProcess({ documentId: uploadResult.id });
        toast.success("Document processing completed successfully!");
        
        // Invalidate queries again to reflect processing results
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['document', uploadResult.id] });
      } catch (processingError) {
        console.error("Failed to process document:", processingError);
        toast.error(
          processingError instanceof Error 
            ? processingError.message 
            : "Failed to process document automatically. You can process it manually later."
        );
      }
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast.error(error.message || "Failed to upload document. Please try again.");
    },
  });
};