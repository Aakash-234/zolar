import { useMemo } from 'react';
import { DocumentError } from './documentErrorAnalyzer';
import { Selectable } from 'kysely';
import { DocumentErrors } from './schema';

/**
 * A hook to parse and retrieve structured error data from document errors.
 * It processes the document errors and returns them in a structured format.
 *
 * @param errors An array of document errors for a specific document.
 * @returns An object containing the errors and the date of the most recent error.
 */
export const useDocumentErrors = (errors: Selectable<DocumentErrors>[] | undefined) => {
  const processedErrors = useMemo(() => {
    if (!errors || errors.length === 0) {
      return { errors: [], reviewedAt: null };
    }

    // Convert DocumentErrors to DocumentError format
    const convertedErrors: DocumentError[] = errors.map(error => ({
      fieldName: error.fieldName,
      errorMessage: error.errorMessage,
      suggestedFix: error.suggestedFix,
      severityLevel: error.severityLevel,
    }));

    // Get the most recent error date
    const mostRecentError = errors
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

    return { 
      errors: convertedErrors, 
      reviewedAt: mostRecentError?.createdAt || null 
    };
  }, [errors]);

  return processedErrors;
};