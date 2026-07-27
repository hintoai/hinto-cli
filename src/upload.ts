import axios, { type AxiosError } from 'axios';
import * as fs from 'fs';
import type {
  MultipartCompleteInput,
  MultipartCreateResult,
  PartUrl,
  UploadedPart,
} from './api/videos';

/**
 * Chunked upload for large video files.
 *
 * A whole-file PUT travels through Cloudflare in front of Supabase Storage,
 * which abandons the response at ~100s and returns HTTP 524. Every file whose
 * transfer outlasts that window failed, regardless of size — at the ~2 MB/s
 * seen in the field the cliff sat around 200 MB. Splitting the transfer into
 * parts keeps each request far inside the window, and lets a part that does
 * time out be retried on its own instead of restarting the whole file.
 */

export interface MultipartUploadApi {
  multipartCreate(
    filename: string,
    contentType: string,
    fileSize: number,
  ): Promise<MultipartCreateResult>;
  multipartSign(
    key: string,
    uploadId: string,
    partNumbers: number[],
  ): Promise<{ urls: PartUrl[]; expiresIn: number }>;
  multipartComplete(input: MultipartCompleteInput): Promise<{ videoId: string }>;
  multipartAbort(key: string, uploadId: string): Promise<void>;
}

export interface MultipartUploadOptions {
  filePath: string;
  filename: string;
  contentType: string;
  fileSize: number;
  api: MultipartUploadApi;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
  /** Overridable so tests do not sleep. */
  retryDelayMs?: number;
  /**
   * Slice size override, in bytes. Defaults to the partSize the server returns.
   * The client owns the slicing arithmetic, so it also derives the part count —
   * the server's partCount is advisory.
   */
  partSizeOverride?: number;
}

/**
 * Parts uploaded at once.
 *
 * Keep this LOW. On a saturated uplink, concurrency does not add throughput — it
 * divides it, which multiplies how long each individual request stays open, and
 * the gateway in front of storage abandons any single request at ~100s. The
 * governing relationship is:
 *
 *   seconds per part = partSize / (uplink / CONCURRENCY)
 *
 * Measured against production on a 0.73 MB/s uplink: 50 MiB parts at concurrency
 * 3 gave each stream ~0.24 MB/s, so one part took ~215s and every attempt died
 * with HTTP 524 — the same failure this uploader exists to fix, one layer down.
 * At 8 MiB and concurrency 2 the same link needs ~23s per part, and still only
 * ~70s on a link three times slower.
 */
const CONCURRENCY = 2;
/** Part URLs requested per sign call. Must not exceed the server's MAX_BATCH of 100. */
const SIGN_BATCH = 50;
const MAX_ATTEMPTS = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A 4xx other than 408/429 will fail identically on retry — a bad signature or
 * a rejected size does not become valid by waiting. Everything else (5xx,
 * including Cloudflare's 502/503/504/524, and bare socket errors like EPIPE or
 * ECONNRESET) is treated as transient.
 */
function isRetryable(err: AxiosError): boolean {
  const status = err.response?.status;
  if (status === undefined) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

async function readPart(filePath: string, start: number, length: number): Promise<Buffer> {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, start);
    // A short read means the file changed under us; completing would upload a
    // truncated part and produce a corrupt object.
    if (bytesRead !== length) {
      throw new Error(
        `Read ${bytesRead} of ${length} bytes at offset ${start} — did the file change?`,
      );
    }
    return buffer;
  } finally {
    await handle.close();
  }
}

async function putPartWithRetry(
  url: string,
  partNumber: number,
  body: Buffer,
  retryDelayMs: number,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.put(url, body, {
        headers: { 'Content-Length': body.length },
        maxBodyLength: Number.POSITIVE_INFINITY,
        maxContentLength: Number.POSITIVE_INFINITY,
      });

      const etag = response.headers.etag ?? response.headers.ETag;
      // Without an ETag there is nothing to send to CompleteMultipartUpload,
      // so this must fail loudly rather than complete with a missing part.
      if (!etag) {
        throw new Error(`Part ${partNumber} upload returned no ETag header`);
      }
      // Passed through verbatim: Supabase omits the quotes AWS adds, and
      // normalising either way makes CompleteMultipartUpload reject the part.
      return String(etag);
    } catch (err) {
      lastError = err;
      const axiosErr = err as AxiosError;
      const isAxios = axios.isAxiosError(err);
      if (!isAxios || !isRetryable(axiosErr) || attempt === MAX_ATTEMPTS) break;
      await sleep(retryDelayMs * 2 ** (attempt - 1));
    }
  }

  const detail =
    axios.isAxiosError(lastError) && lastError.response
      ? `HTTP ${lastError.response.status}`
      : lastError instanceof Error
        ? lastError.message
        : String(lastError);
  throw new Error(`Failed to upload part ${partNumber}: ${detail}`);
}

export async function uploadFileMultipart(
  opts: MultipartUploadOptions,
): Promise<{ videoId: string }> {
  const { filePath, filename, contentType, fileSize, api, onProgress } = opts;
  const retryDelayMs = opts.retryDelayMs ?? 1000;

  const created = await api.multipartCreate(filename, contentType, fileSize);
  const { videoId, key, uploadId } = created;
  // The client does the slicing, so it derives the count from the size it will
  // actually use. Trusting the server's partCount while overriding partSize
  // would upload the wrong number of parts.
  const partSize = opts.partSizeOverride ?? created.partSize;
  const partCount = Math.ceil(fileSize / partSize);

  const uploaded: UploadedPart[] = [];
  let uploadedBytes = 0;

  try {
    // Sign in batches as the upload walks forward: signing all parts upfront
    // would let the later URLs expire during a long transfer.
    for (let batchStart = 1; batchStart <= partCount; batchStart += SIGN_BATCH) {
      const partNumbers: number[] = [];
      for (let n = batchStart; n < batchStart + SIGN_BATCH && n <= partCount; n++) {
        partNumbers.push(n);
      }

      const { urls } = await api.multipartSign(key, uploadId, partNumbers);
      const byPartNumber = new Map(urls.map((u) => [u.partNumber, u.url]));

      for (let i = 0; i < partNumbers.length; i += CONCURRENCY) {
        const slice = partNumbers.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          slice.map(async (partNumber) => {
            const url = byPartNumber.get(partNumber);
            if (!url) throw new Error(`Server did not return a URL for part ${partNumber}`);

            const start = (partNumber - 1) * partSize;
            const length = Math.min(partSize, fileSize - start);
            const body = await readPart(filePath, start, length);
            const etag = await putPartWithRetry(url, partNumber, body, retryDelayMs);
            return { partNumber, etag, length };
          }),
        );

        for (const r of results) {
          uploaded.push({ partNumber: r.partNumber, etag: r.etag });
          uploadedBytes += r.length;
        }
        onProgress?.(uploadedBytes, fileSize);
      }
    }
  } catch (err) {
    // Parts of an abandoned multipart upload are invisible to ListObjects and
    // would otherwise sit in the bucket forever. Abort failure must not mask
    // the real error, so it is swallowed.
    await api.multipartAbort(key, uploadId).catch(() => undefined);
    throw err;
  }

  uploaded.sort((a, b) => a.partNumber - b.partNumber);

  return api.multipartComplete({ videoId, key, uploadId, filename, parts: uploaded });
}
