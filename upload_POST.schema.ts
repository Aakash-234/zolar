import { z } from "zod";
import superjson from 'superjson';
import { DocumentTypeArrayValues } from "../../helpers/schema";
import type { Selectable } from "kysely";
import type { Documents } from "../../helpers/schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const schema = z.object({
  file: z
    .instanceof(File, { message: "File is required." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size should be less than 10MB.`)
    .refine(
      (file) => ACCEPTED_MIME_TYPES.includes(file.type),
      "Only .jpg, .png, .webp and .pdf files are accepted."
    ),
  projectName: z.string().min(1, "Project name is required."),
  installerCompany: z.string().min(1, "Installer company is required."),
  documentType: z.enum(DocumentTypeArrayValues),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Documents>;

export const postDocumentsUpload = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  // We don't use schema.parse here because we are sending FormData
  const formData = new FormData();
  formData.append("file", body.file);
  formData.append("projectName", body.projectName);
  formData.append("installerCompany", body.installerCompany);
  formData.append("documentType", body.documentType);

  const result = await fetch(`/_api/documents/upload`, {
    method: "POST",
    body: formData,
    ...init,
    // Do not set Content-Type header for FormData, the browser will do it with the correct boundary
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = (errorObject && typeof errorObject === 'object' && 'error' in errorObject && typeof errorObject.error === 'string') 
      ? errorObject.error 
      : "Failed to upload document";
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await result.text());
};