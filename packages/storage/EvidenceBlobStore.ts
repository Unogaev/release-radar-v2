// packages/storage/EvidenceBlobStore.ts
//
// Spec §6 requires storing "screenshot/DOM evidence" for every availability
// check. This interface decouples that requirement from WHERE it's stored:
// local disk in development, Vercel Blob or S3-compatible storage in
// production (Phase 2, once Playwright verification workers exist).

export interface EvidenceBlobStore {
  put(key: string, data: Buffer, contentType: string): Promise<{ ref: string }>;
  get(ref: string): Promise<Buffer>;
}

// Phase 2 implements: LocalDiskEvidenceStore (dev), VercelBlobEvidenceStore (prod)
