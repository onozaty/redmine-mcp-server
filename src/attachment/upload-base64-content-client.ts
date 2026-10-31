/**
 * HTTP client for Base64 content upload to Redmine
 */
import { getUploadAttachmentFileUrl } from "../__generated__/http-client";
import { customFetch } from "../api/custom-fetch";
import { UploadFileResponse } from "../types/attachment";

export async function uploadBase64ContentToRedmine(
  content: string,
  filename: string
): Promise<UploadFileResponse> {
  // Validate Base64 content
  if (!content) {
    throw new Error("Base64 content is required");
  }

  if (!filename) {
    throw new Error("Filename is required");
  }

  // Convert Base64 to Buffer
  let fileBuffer: Buffer<ArrayBuffer>;
  try {
    fileBuffer = Buffer.from(content, "base64");
  } catch (error) {
    throw new Error(`Invalid Base64 content: ${error}`);
  }

  const url = getUploadAttachmentFileUrl("json", { filename });

  const response = await customFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upload failed with status ${response.status}: ${errorText}`
    );
  }

  const result = (await response.json()) as UploadFileResponse;
  return result;
}
