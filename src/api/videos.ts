import type { AxiosInstance } from 'axios';

export interface VideoListItem {
  videoId: string;
  filename?: string | null;
  durationSeconds?: number | null;
  status: string;
  createdAt: string;
}

export interface VideoListParams {
  offset?: number;
  limit?: number;
}

export interface MultipartCreateResult {
  videoId: string;
  key: string;
  uploadId: string;
  partSize: number;
  partCount: number;
}

export interface PartUrl {
  partNumber: number;
  url: string;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

export interface MultipartCompleteInput {
  videoId: string;
  key: string;
  uploadId: string;
  filename: string;
  parts: UploadedPart[];
}

export const videosApi = (client: AxiosInstance) => ({
  list: (params?: VideoListParams) =>
    client
      .get<{
        videos: VideoListItem[];
        pagination: { limit: number; offset: number; count: number };
      }>('/videos', { params })
      .then((r) => r.data),

  get: (videoId: string) =>
    client
      .get<{
        videoId: string;
        filename?: string | null;
        status: string;
        durationSeconds?: number | null;
        createdAt: string;
      }>(`/videos/${videoId}`)
      .then((r) => r.data),

  status: (videoId: string) =>
    client
      .get<{
        videoId: string;
        filename?: string | null;
        status: string;
        durationSeconds?: number | null;
        createdAt: string;
      }>(`/videos/${videoId}/status`)
      .then((r) => r.data),

  import: (url: string, name?: string, callbackUrl?: string, callbackSecret?: string) =>
    client
      .post<import('./generate').Job>('/videos/import', {
        url,
        ...(name ? { name } : {}),
        ...(callbackUrl ? { callbackUrl } : {}),
        ...(callbackSecret ? { callbackSecret } : {}),
      })
      .then((r) => r.data),

  uploadPresigned: (filename: string, contentType: string, fileSize?: number) =>
    client
      .post<{ videoId: string; uploadUrl: string; s3Url: string; key: string; expiresIn: number }>(
        '/videos/upload/presigned',
        { filename, contentType, ...(fileSize !== undefined ? { fileSize } : {}) },
      )
      .then((r) => r.data),

  uploadComplete: (videoId: string, key: string, filename: string) =>
    client
      .post<{ videoId: string }>('/videos/upload/complete', { key, fileId: videoId, filename })
      .then((r) => r.data),

  multipartCreate: (filename: string, contentType: string, fileSize: number) =>
    client
      .post<MultipartCreateResult>('/videos/upload/multipart/create', {
        filename,
        contentType,
        fileSize,
      })
      .then((r) => r.data),

  multipartSign: (key: string, uploadId: string, partNumbers: number[]) =>
    client
      .post<{ urls: PartUrl[]; expiresIn: number }>('/videos/upload/multipart/sign', {
        key,
        uploadId,
        partNumbers,
      })
      .then((r) => r.data),

  multipartComplete: (input: MultipartCompleteInput) =>
    client
      .post<{ videoId: string }>('/videos/upload/multipart/complete', input)
      .then((r) => r.data),

  multipartAbort: (key: string, uploadId: string) =>
    client.post('/videos/upload/multipart/abort', { key, uploadId }).then(() => undefined),

  delete: (videoId: string) => client.delete(`/videos/${videoId}`).then((r) => r.data),
});
