import { useQuery } from '@tanstack/react-query';
import { Selectable } from 'kysely';
import { DocumentErrors } from './schema';

// Mock function - in a real app this would call an actual endpoint
const fetchDocumentErrors = async (documentId: string): Promise<Selectable<DocumentErrors>[]> => {
  // This would be replaced with actual API call
  const response = await fetch(`/_api/documents/${documentId}/errors`);
  if (!response.ok) {
    throw new Error('Failed to fetch document errors');
  }
  return response.json();
};

export const useDocumentErrorsQuery = (documentId: string | null) => {
  return useQuery({
    queryKey: ['documentErrors', documentId],
    queryFn: () => fetchDocumentErrors(documentId!),
    enabled: !!documentId,
    placeholderData: (previousData) => previousData,
  });
};