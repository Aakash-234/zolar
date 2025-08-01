import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle, CheckCircle, Loader2, Bug } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Separator } from './Separator';
import { ErrorSummaryStats } from './ErrorSummaryStats';
import { useDocumentErrors } from '../helpers/useDocumentErrors';
import { useDocumentErrorsQuery } from '../helpers/useDocumentErrorsQuery';
import { useResolveDocumentError } from '../helpers/useResolveDocumentError';
import { useAnalyzeDocumentErrors } from '../helpers/useDocumentErrorAnalysis';
import { ErrorSeverityLevel } from '../helpers/schema';
import { DocumentError } from '../helpers/documentErrorAnalyzer';
import styles from './ErrorAnalysisSection.module.css';

interface ErrorAnalysisSectionProps {
  documentId: string;
  className?: string;
}

const severityConfig: Record<ErrorSeverityLevel, { 
  label: string; 
  icon: React.ReactNode; 
  badgeVariant: 'default' | 'destructive' | 'warning' | 'secondary';
  color: string;
}> = {
  critical: { 
    label: 'Critical', 
    icon: <XCircle size={14} />, 
    badgeVariant: 'destructive',
    color: 'var(--error)'
  },
  high: { 
    label: 'High Priority', 
    icon: <AlertTriangle size={14} />, 
    badgeVariant: 'warning',
    color: 'var(--warning)'
  },
  medium: { 
    label: 'Medium Priority', 
    icon: <AlertCircle size={14} />, 
    badgeVariant: 'secondary',
    color: 'var(--secondary)'
  },
  low: { 
    label: 'Low Priority', 
    icon: <Info size={14} />, 
    badgeVariant: 'default',
    color: 'var(--muted-foreground)'
  },
};

export const ErrorAnalysisSection = ({ documentId, className }: ErrorAnalysisSectionProps) => {
  const { data: rawErrors, isFetching, error: queryError } = useDocumentErrorsQuery(documentId);
  const { errors } = useDocumentErrors(rawErrors);
  const resolveMutation = useResolveDocumentError();
  const analyzeMutation = useAnalyzeDocumentErrors();

  const handleAnalyzeErrors = () => {
    analyzeMutation.mutate({ documentId });
  };

  const handleResolveError = (errorId: string) => {
    resolveMutation.mutate({ errorId });
  };

  if (queryError) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.errorState}>
          <AlertCircle size={24} />
          <p>Failed to load error analysis</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyzeErrors}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Bug size={16} />
                Retry Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            <Bug size={20} />
            Error Analysis
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyzeErrors}
            disabled={analyzeMutation.isPending || isFetching}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Bug size={16} />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {isFetching ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className="animate-spin" />
          <p>Loading error analysis...</p>
        </div>
      ) : (
        <>
          <ErrorSummaryStats errors={errors} className={styles.summaryStats} />
          
          {errors.length > 0 ? (
            <div className={styles.errorsList}>
              <h4 className={styles.errorsTitle}>Detected Issues</h4>
              <div className={styles.errorsGrid}>
                {errors.map((error, index) => {
                  const config = severityConfig[error.severityLevel];
                  return (
                    <div 
                      key={index} 
                      className={styles.errorItem}
                      style={{ borderLeftColor: config.color }}
                    >
                      <div className={styles.errorHeader}>
                        <Badge variant={config.badgeVariant}>
                          {config.icon}
                          {config.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveError(`error-${index}`)}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle size={16} />
                          Mark Resolved
                        </Button>
                      </div>
                      
                      {error.fieldName && (
                        <div className={styles.fieldName}>
                          Field: <span>{error.fieldName}</span>
                        </div>
                      )}
                      
                      <div className={styles.errorMessage}>
                        <strong>Issue:</strong> {error.errorMessage}
                      </div>
                      
                      <div className={styles.suggestedFix}>
                        <strong>Suggested Fix:</strong> {error.suggestedFix}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.noErrorsState}>
              <CheckCircle size={48} />
              <h4>No Issues Found</h4>
              <p>This document has passed all error checks.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};