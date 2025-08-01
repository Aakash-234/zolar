import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useDocuments } from '../helpers/useDocuments';
import { useDocumentDetails } from '../helpers/useDocumentDetails';
import { useDocumentStatusMutation } from '../helpers/useDocumentStatusMutation';
import { useDocumentAnalytics } from '../helpers/useDocumentAnalytics';
import { DocumentStatus, DocumentType, DocumentStatusArrayValues, DocumentTypeArrayValues } from '../helpers/schema';
import type { Selectable } from 'kysely';
import type { Documents, DocumentFields, DocumentReviews } from '../helpers/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/Select';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../components/Sheet';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  List,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Bug,
} from 'lucide-react';
import { ErrorAnalysisSection } from '../components/ErrorAnalysisSection';
import styles from './dashboard.module.css';

const documentTypeLabels: Record<DocumentType, string> = {
  homeowner_id: 'Homeowner ID',
  installation_photo: 'Installation Photo',
  loan_doc: 'Loan Document',
  rebate_form: 'Rebate Form',
};

const statusConfig: Record<DocumentStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  pending: { label: 'Pending', icon: <Clock size={14} />, variant: 'default' },
  processing: { label: 'Processing', icon: <Loader2 size={14} className="animate-spin" />, variant: 'secondary' },
  reviewed: { label: 'Reviewed', icon: <Eye size={14} />, variant: 'secondary' },
  approved: { label: 'Approved', icon: <CheckCircle size={14} />, variant: 'success' },
  rejected: { label: 'Rejected', icon: <XCircle size={14} />, variant: 'destructive' },
};

const AnalyticsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className={styles.analyticsCard}>
    <div className={styles.analyticsIcon}>{icon}</div>
    <div className={styles.analyticsContent}>
      <p className={styles.analyticsValue}>{value}</p>
      <p className={styles.analyticsTitle}>{title}</p>
    </div>
  </div>
);

const AnalyticsSection = () => {
  const { data, isFetching, error } = useDocumentAnalytics();

  if (isFetching) {
    return (
      <div className={styles.analyticsGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.analyticsCard}>
            <Skeleton style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)' }} />
            <div style={{ width: '100%' }}>
              <Skeleton style={{ width: '50%', height: '24px', marginBottom: '8px' }} />
              <Skeleton style={{ width: '80%', height: '16px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorState}>Failed to load analytics.</div>;
  }

  const totalDocuments = Object.values(data?.statusCounts ?? {}).reduce((sum, count) => sum + count, 0);

  return (
    <div className={styles.analyticsGrid}>
      <AnalyticsCard title="Total Documents" value={totalDocuments} icon={<List size={20} />} />
      <AnalyticsCard title="Pending Review" value={data?.statusCounts.pending ?? 0} icon={<Clock size={20} />} />
      <AnalyticsCard title="Approved" value={data?.statusCounts.approved ?? 0} icon={<CheckCircle size={20} />} />
      <AnalyticsCard title="Rejected" value={data?.statusCounts.rejected ?? 0} icon={<XCircle size={20} />} />
    </div>
  );
};

const DocumentList = ({ onSelectDocument }: { onSelectDocument: (id: string) => void }) => {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: undefined as DocumentStatus | undefined,
    documentType: undefined as DocumentType | undefined,
    searchQuery: '',
  });

  const { data, isFetching, error } = useDocuments(filters);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const documents = data?.documents ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  return (
    <div className={styles.listContainer}>
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            placeholder="Search by project or filename..."
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select onValueChange={(v) => handleFilterChange('status', v === '__empty' ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">All Statuses</SelectItem>
            {DocumentStatusArrayValues.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => handleFilterChange('documentType', v === '__empty' ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">All Types</SelectItem>
            {DocumentTypeArrayValues.map(t => <SelectItem key={t} value={t}>{documentTypeLabels[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Document Type</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isFetching && [...Array(filters.pageSize)].map((_, i) => (
              <tr key={i}>
                <td><Skeleton style={{ height: '20px', width: '80%' }} /></td>
                <td><Skeleton style={{ height: '20px', width: '60%' }} /></td>
                <td><Skeleton style={{ height: '20px', width: '70%' }} /></td>
                <td><Skeleton style={{ height: '24px', width: '100px', borderRadius: 'var(--radius-full)' }} /></td>
                <td><Skeleton style={{ height: '32px', width: '32px', borderRadius: 'var(--radius)' }} /></td>
              </tr>
            ))}
            {!isFetching && documents.map(doc => (
              <tr key={doc.id} onClick={() => onSelectDocument(doc.id)}>
                <td>
                  <div className={styles.cellPrimary}>{doc.projectName}</div>
                  <div className={styles.cellSecondary}>{doc.originalFilename}</div>
                </td>
                <td>{doc.documentType ? documentTypeLabels[doc.documentType] : 'N/A'}</td>
                <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {doc.status && (
                    <Badge variant={statusConfig[doc.status].variant}>
                      {statusConfig[doc.status].icon}
                      {statusConfig[doc.status].label}
                    </Badge>
                  )}
                </td>
                <td>
                  <Button variant="ghost" size="icon-sm" aria-label="View details">
                    <Eye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isFetching && documents.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>No documents found</p>
            <span>Try adjusting your filters or upload a new document.</span>
          </div>
        )}
        {error && <div className={styles.errorState}>Error loading documents.</div>}
      </div>

      <div className={styles.pagination}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange('page', filters.page - 1)}
          disabled={filters.page <= 1}
        >
          <ChevronLeft size={16} /> Previous
        </Button>
        <span>Page {filters.page} of {totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange('page', filters.page + 1)}
          disabled={filters.page >= totalPages}
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

const DocumentDetails = ({ documentId, onClose }: { documentId: string | null; onClose: () => void; }) => {
  const { data, isFetching, error } = useDocumentDetails(documentId);
  const statusMutation = useDocumentStatusMutation();

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    if (!documentId) return;
    statusMutation.mutate({ documentId, status, reviewNotes: `Manually set to ${status}` });
  };

  const document = data?.document;
  const fields = data?.fields ?? [];

  return (
    <Sheet open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={styles.sheetContent}>
        {isFetching && (
          <div className={styles.sheetPadding}>
            <Skeleton style={{ height: '32px', width: '70%', marginBottom: '8px' }} />
            <Skeleton style={{ height: '20px', width: '50%', marginBottom: '24px' }} />
            <div className={styles.detailsGrid}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: '40px' }} />)}
            </div>
            <Skeleton style={{ height: '24px', width: '40%', margin: '24px 0 16px' }} />
            <div className={styles.fieldsList}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '50px' }} />)}
            </div>
          </div>
        )}
        {error && <div className={`${styles.errorState} ${styles.sheetPadding}`}>Failed to load document details.</div>}
        {document && (
          <>
            <SheetHeader className={styles.sheetHeader}>
              <SheetTitle>{document.projectName}</SheetTitle>
              <SheetDescription>{document.originalFilename}</SheetDescription>
              {document.status && (
                <Badge variant={statusConfig[document.status].variant} className={styles.sheetBadge}>
                  {statusConfig[document.status].icon}
                  {statusConfig[document.status].label}
                </Badge>
              )}
            </SheetHeader>
            <div className={styles.sheetBody}>
              <div className={styles.detailsGrid}>
                <div><span>Type</span><p>{documentTypeLabels[document.documentType]}</p></div>
                <div><span>Installer</span><p>{document.installerCompany}</p></div>
                <div><span>Uploaded</span><p>{new Date(document.uploadedAt!).toLocaleString()}</p></div>
                <div><span>Last Update</span><p>{new Date(document.updatedAt!).toLocaleString()}</p></div>
                {document.processedAt && (
                  <div><span>Processed</span><p>{new Date(document.processedAt).toLocaleString()}</p></div>
                )}
                {document.reviewedAt && (
                  <div><span>Reviewed</span><p>{new Date(document.reviewedAt).toLocaleString()}</p></div>
                )}
              </div>

              {documentId && (
                <ErrorAnalysisSection documentId={documentId} className={styles.errorAnalysis} />
              )}

              <h3 className={styles.sectionHeading}>Extracted Fields</h3>
              <div className={styles.fieldsList}>
                {fields.length > 0 ? fields.map(field => (
                  <div key={field.id} className={styles.fieldItem}>
                    <div className={styles.fieldInfo}>
                      <div className={styles.fieldHeader}>
                        <span className={styles.fieldName}>{field.fieldName}</span>
                        {field.confidenceScore && (
                          <span className={styles.confidenceScore}>
                            {Math.round(Number(field.confidenceScore) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className={styles.fieldValue}>{field.fieldValue}</p>
                      {field.validationNotes && (
                        <p className={styles.validationNotes}>{field.validationNotes}</p>
                      )}
                    </div>
                    <div className={styles.fieldActions}>
                      <Badge variant={field.isValidated ? 'success' : 'warning'}>
                        {field.isValidated ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {field.isValidated ? 'Validated' : 'Needs Review'}
                      </Badge>
                    </div>
                  </div>
                )) : <p className={styles.noDataText}>No fields extracted yet.</p>}
              </div>
            </div>
            <div className={styles.sheetFooter}>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={statusMutation.isPending}
              >
                <ThumbsDown size={16} /> Reject
              </Button>
              <Button
                onClick={() => handleStatusUpdate('approved')}
                disabled={statusMutation.isPending}
              >
                <ThumbsUp size={16} /> Approve
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default function DashboardPage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  return (
    <>
      <Helmet>
        <title>Dashboard | Floot</title>
        <meta name="description" content="Review and manage document verifications." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Monitor, review, and manage all your installation documents.
          </p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><BarChart2 size={20} /> Analytics Overview</h2>
          <AnalyticsSection />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><List size={20} /> Document Queue</h2>
          <DocumentList onSelectDocument={setSelectedDocumentId} />
        </section>
      </div>
      <DocumentDetails
        documentId={selectedDocumentId}
        onClose={() => setSelectedDocumentId(null)}
      />
    </>
  );
}