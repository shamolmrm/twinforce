import * as Minio from "minio";
import { logger } from "./logger.ts";

let client: Minio.Client;

export function getMinioClient(): Minio.Client {
  if (!client) {
    client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
      port: parseInt(process.env.MINIO_PORT ?? "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
    });
  }
  return client;
}

const BUCKET = process.env.MINIO_BUCKET ?? "twinforce";

export async function ensureBucket(): Promise<void> {
  const c = getMinioClient();
  const exists = await c.bucketExists(BUCKET);
  if (!exists) {
    await c.makeBucket(BUCKET, "us-east-1");
    logger.info({ bucket: BUCKET }, "MinIO bucket created");
  }
}

export async function uploadFile(
  objectName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const c = getMinioClient();
  await c.putObject(BUCKET, objectName, buffer, buffer.length, { "Content-Type": contentType });
  return `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${objectName}`;
}

export async function getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
  return getMinioClient().presignedGetObject(BUCKET, objectName, expirySeconds);
}

export async function deleteFile(objectName: string): Promise<void> {
  await getMinioClient().removeObject(BUCKET, objectName);
}
