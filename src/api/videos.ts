import { AxiosInstance } from 'axios';

export interface Video {
  videoId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  url?: string | null;
  createdAt: string;
}

export interface VideoListParams {
  page?: number;
  limit?: number;
}

export const videosApi = (client: AxiosInstance) => ({
  list: (params?: VideoListParams) =>
    client.get<{ videos: Video[]; total: number }>('/videos', { params }).then(r => r.data),

  get: (videoId: string) =>
    client.get<Video>(`/videos/${videoId}`).then(r => r.data),

  status: (videoId: string) =>
    client.get<Video>(`/videos/${videoId}/status`).then(r => r.data),

  import: (url: string) =>
    client.post<{ jobId: string; status: string; message: string }>('/videos/import', { url }).then(r => r.data),

  uploadPresigned: (filename: string, contentType: string) =>
    client.post<{ video_id: string; upload_url: string; s3_url: string; expires_in: number }>('/videos/upload/presigned', { filename, content_type: contentType }).then(r => r.data),

  uploadComplete: (videoId: string) =>
    client.post<Video>('/videos/upload/complete', { videoId }).then(r => r.data),

  delete: (videoId: string) =>
    client.delete(`/videos/${videoId}`).then(r => r.data),
});
