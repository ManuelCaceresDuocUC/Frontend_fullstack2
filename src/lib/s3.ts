// src/lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
});

export async function presignPut(key: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: 60 }
  );
}

export async function deleteMany(keys: string[]) {
  if (!keys.length) return;
  await s3.send(new DeleteObjectsCommand({
    Bucket: process.env.S3_BUCKET!,
    Delete: { Objects: keys.map(Key => ({ Key })) },
  }));
}
