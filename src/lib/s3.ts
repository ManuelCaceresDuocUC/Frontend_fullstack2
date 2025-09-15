// src/lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION!;
const bucket = process.env.S3_BUCKET!;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;

export const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

export async function presignPut(key: string, contentType: string) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: 60 });
}

export function publicUrlFor(key: string) {
  const base =
    process.env.NEXT_PUBLIC_S3_BASE ?? `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base}/${key.replace(/^\/+/, "")}`;
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// <= 1000 por llamada; troceamos si hay más
export async function deleteMany(keys: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) chunks.push(keys.slice(i, i + 1000));

  const deleted: string[] = [];
  const errors: { key: string; message: string }[] = [];

  for (const part of chunks) {
    const resp = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: part.map((k) => ({ Key: k })) },
      })
    );
    (resp.Deleted ?? []).forEach((d) => d.Key && deleted.push(d.Key));
    (resp.Errors ?? []).forEach((e) =>
      errors.push({ key: e.Key ?? "(unknown)", message: e.Message ?? "error" })
    );
  }
  return { deleted, errors };
}

// opcional: borrar por prefijo "carpeta"
export async function deleteByPrefix(prefix: string) {
  const keys: string[] = [];
  let Token: string | undefined;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: Token })
    );
    (r.Contents ?? []).forEach((o) => o.Key && keys.push(o.Key));
    Token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (Token);
  return keys.length ? deleteMany(keys) : { deleted: [], errors: [] };
}
