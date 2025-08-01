import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/Select';
import { Progress } from '../components/Progress';
import { FileDropzone } from '../components/FileDropzone';
import { useUploadDocument } from '../helpers/useUploadDocument';
import { useProcessDocument } from '../helpers/useProcessDocument';
import { useAnalyzeDocumentErrors } from '../helpers/useDocumentErrorAnalysis';
import { ErrorSummaryStats } from '../components/ErrorSummaryStats';
import { DocumentTypeArrayValues, DocumentType } from '../helpers/schema';
import styles from './upload.module.css';

const uploadSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters long.'),
  installerCompany: z.string().min(3, 'Installer company must be at least 3 characters long.'),
  documentType: z.enum(DocumentTypeArrayValues, {
    errorMap: () => ({ message: 'Please select a document type.' }),
  }),
  file: z.instanceof(File, { message: 'A file is required.' }),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const documentTypeLabels: Record<DocumentType, string> = {
  homeowner_id: 'Homeowner ID',
  installation_photo: 'Installation Photo',
  loan_doc: 'Loan Document',
  rebate_form: 'Rebate Form',
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedFields, setExtractedFields] = useState<any[]>([]);
  const [errorAnalysisResults, setErrorAnalysisResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'analyzing' | 'complete'>('upload');
  const uploadMutation = useUploadDocument();
  const processMutation = useProcessDocument();
  const analyzeErrorsMutation = useAnalyzeDocumentErrors();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const onFileSelect = useCallback((files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValue('file', selectedFile, { shouldValidate: true });
    }
  }, [setValue]);

  const removeFile = () => {
    setFile(null);
    setValue('file', undefined as any, { shouldValidate: true });
  };

  const onSubmit = async (data: UploadFormValues) => {
    // Upload progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      // Step 1: Upload document
      const uploadResult = await uploadMutation.mutateAsync(data);
      setUploadProgress(100);
      setCurrentStep('processing');
      
      // Step 2: Process document
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(processingInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const processResult = await processMutation.mutateAsync({ 
        documentId: uploadResult.id 
      });
      
      clearInterval(processingInterval);
      setProcessingProgress(100);
      setExtractedFields(processResult.fields);
      
      // Step 3: Analyze errors
      setCurrentStep('analyzing');
      const errorAnalysisResult = await analyzeErrorsMutation.mutateAsync({
        documentId: uploadResult.id
      });
      
      setErrorAnalysisResults(errorAnalysisResult.errors);
      setCurrentStep('complete');
      
      toast.success('Document processed successfully!');
      
      // Auto-redirect after showing results
      setTimeout(() => {
        reset();
        setFile(null);
        setUploadProgress(0);
        setProcessingProgress(0);
        setExtractedFields([]);
        setErrorAnalysisResults([]);
        setCurrentStep('upload');
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setProcessingProgress(0);
      setErrorAnalysisResults([]);
      setCurrentStep('upload');
      // Error toast is handled by the mutation hooks
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Document | Floot</title>
        <meta name="description" content="Upload new documents for verification." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Upload Document</h1>
          <p className={styles.subtitle}>
            Submit a new document for AI-powered verification.
          </p>
        </div>

        <div className={styles.uploadCard}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {!file && (
              <Controller
                name="file"
                control={control}
                render={() => (
                  <>
                    <FileDropzone
                      onFilesSelected={onFileSelect}
                      accept="image/jpeg,image/png,application/pdf"
                      maxSize={10 * 1024 * 1024} // 10MB
                      disabled={isSubmitting}
                      icon={<UploadCloud size={48} />}
                      title="Drag & drop a file here or click to select"
                      subtitle="PNG, JPG, or PDF. Max 10MB."
                    />
                    {errors.file && <p className={styles.errorText}>{errors.file.message}</p>}
                  </>
                )}
              />
            )}

            {file && (
              <div className={styles.filePreview}>
                <div className={styles.fileInfo}>
                  <FileIcon className={styles.fileIcon} />
                  <div className={styles.fileDetails}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </Button>
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="projectName">Project Name</label>
                <Controller
                  name="projectName"
                  control={control}
                  render={({ field }) => <Input id="projectName" placeholder="e.g., Smith Residence Solar" {...field} />}
                />
                {errors.projectName && <p className={styles.errorText}>{errors.projectName.message}</p>}
              </div>

              <div className={styles.formField}>
                <label htmlFor="installerCompany">Installer Company</label>
                <Controller
                  name="installerCompany"
                  control={control}
                  render={({ field }) => <Input id="installerCompany" placeholder="e.g., CleanEnergy EU" {...field} />}
                />
                {errors.installerCompany && <p className={styles.errorText}>{errors.installerCompany.message}</p>}
              </div>

              <div className={styles.formField}>
                <label>Document Type</label>
                <Controller
                  name="documentType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DocumentTypeArrayValues.map((type) => (
                          <SelectItem key={type} value={type}>
                            {documentTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.documentType && <p className={styles.errorText}>{errors.documentType.message}</p>}
              </div>
            </div>

            {isSubmitting && (
              <div className={styles.progressContainer}>
                {currentStep === 'upload' && (
                  <>
                    <Progress value={uploadProgress} />
                    <p>Uploading... {uploadProgress}%</p>
                  </>
                )}
                {currentStep === 'processing' && (
                  <>
                    <Progress value={processingProgress} />
                    <p>Processing document... {processingProgress}%</p>
                  </>
                )}
                {currentStep === 'analyzing' && (
                  <>
                    <Progress value={100} />
                    <p>Analyzing for errors...</p>
                  </>
                )}
                {currentStep === 'complete' && (
                  <>
                    <Progress value={100} />
                    <p>Processing complete!</p>
                  </>
                )}
              </div>
            )}

            {currentStep === 'complete' && (
              <>
                {errorAnalysisResults.length > 0 && (
                  <div className={styles.errorAnalysisResults}>
                    <h3>Error Analysis Results</h3>
                    <ErrorSummaryStats errors={errorAnalysisResults} />
                    <p className={styles.analysisNote}>
                      {errorAnalysisResults.length} potential issue{errorAnalysisResults.length !== 1 ? 's' : ''} detected. 
                      Review these in the dashboard for detailed recommendations.
                    </p>
                  </div>
                )}
                
                {extractedFields.length > 0 && (
                  <div className={styles.extractedFields}>
                    <h3>Extracted Fields</h3>
                    <div className={styles.fieldsList}>
                      {extractedFields.map((field, index) => (
                        <div key={index} className={styles.fieldItem}>
                          <div className={styles.fieldInfo}>
                            <span className={styles.fieldName}>{field.fieldName}</span>
                            <p className={styles.fieldValue}>{field.fieldValue}</p>
                            {field.confidenceScore && (
                              <span className={styles.confidenceScore}>
                                Confidence: {Math.round(field.confidenceScore * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={styles.formActions}>
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || !file}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {currentStep === 'upload' && 'Uploading...'}
                    {currentStep === 'processing' && 'Processing...'}
                    {currentStep === 'analyzing' && 'Analyzing...'}
                    {currentStep === 'complete' && 'Complete!'}
                  </>
                ) : (
                  'Upload and Process'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}