import { AxiosInstance } from 'axios';

export interface Video {
  id: string;
  filename?: string | null;
  duration?: number | null;
  ingest_status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  project_id?: string | null;
  user_id?: string | null;
}

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

export const videosApi = (client: AxiosInstance) => ({
  list: (params?: VideoListParams) =>
    client.get<{ videos: VideoListItem[]; pagination: { limit: number; offset: number; count: number } }>('/videos', { params }).then(r => r.data),

  get: (videoId: string) =>
    client.get<{ videoId: string; filename?: string | null; status: string; durationSeconds?: number | null; createdAt: string }>(`/videos/${videoId}`).then(r => r.data),

  status: (videoId: string) =>
    client.get<{ videoId: string; filename?: string | null; status: string; durationSeconds?: number | null; createdAt: string }>(`/videos/${videoId}/status`).then(r => r.data),

  import: (url: string) =>
    client.post<{ jobId: string; status: string; message: string }>('/videos/import', { url }).then(r => r.data),

  uploadPresigned: (filename: string, contentType: string) =>
    client.post<{ video_id: string; upload_url: string; s3_url: string; expires_in: number }>('/videos/upload/presigned', { filename, content_type: contentType }).then(r => r.data),

  uploadComplete: (videoId: string, key: string, filename: string) =>
    client.post<{ videoId: string }>('/videos/upload/complete', { key, fileId: videoId, filename }).then(r => r.data),

  delete: (videoId: string) =>
    client.delete(`/videos/${videoId}`).then(r => r.data),
});
