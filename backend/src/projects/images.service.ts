import { BadRequestException, Inject, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, Db } from '../db/database';
import { projectImages } from '../db/schema';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel caps proxied request bodies at 4.5 MB

// The type comes from the bytes, never from the client's Content-Type or filename.
export function sniffImage(bytes: Buffer): string | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts([0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  return null;
}

@Injectable()
export class ImagesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // `allowPdf`: the CV upload. Project images stay images only.
  async save(bytes: Buffer | undefined, allowPdf = false) {
    if (!bytes?.length) throw new BadRequestException('No file');
    if (bytes.length > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('Files are limited to 4 MB');
    const mime = sniffImage(bytes);
    if (!mime || (mime === 'application/pdf' && !allowPdf)) {
      throw new BadRequestException(allowPdf ? 'Only PDF, PNG, JPEG, WebP and GIF files are accepted' : 'Only PNG, JPEG, WebP and GIF images are accepted');
    }
    const [row] = await this.db.insert(projectImages).values({ mime, size: bytes.length, bytes }).returning({ id: projectImages.id });
    return { id: row.id, url: `/api/${mime === 'application/pdf' ? 'files' : 'images'}/${row.id}` };
  }

  async get(id: string) {
    const [row] = await this.db.select({ mime: projectImages.mime, bytes: projectImages.bytes }).from(projectImages).where(eq(projectImages.id, id));
    if (!row) throw new NotFoundException();
    return row;
  }
}
