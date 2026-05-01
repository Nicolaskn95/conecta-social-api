import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { S3Client as S3ClientType } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

type S3Module = typeof import('@aws-sdk/client-s3');
type S3PresignerModule = typeof import('@aws-sdk/s3-request-presigner');

export interface DonationImageMetadata {
  image_key: string;
  image_bucket: string;
  image_content_type: string;
  image_original_name: string;
}

interface SignableDonationImage {
  image_key?: string | null;
  image_bucket?: string | null;
}

const MAX_SIGNED_URL_TTL_SECONDS = 60 * 60;

@Injectable()
export class DonationImageService {
  private s3Client?: S3ClientType;
  private s3Module?: S3Module;
  private s3PresignerModule?: S3PresignerModule;

  async upload(file: Express.Multer.File): Promise<DonationImageMetadata> {
    this.validateFile(file);

    const bucket = this.bucket;
    const key = this.createObjectKey(file.originalname);
    const s3 = await this.getS3();
    const client = await this.getClient();

    try {
      await client.send(
        new s3.PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
    } catch {
      throw new InternalServerErrorException(
        'Falha ao enviar imagem da doação para o S3'
      );
    }

    return {
      image_key: key,
      image_bucket: bucket,
      image_content_type: file.mimetype,
      image_original_name: file.originalname,
    };
  }

  async getSignedImageUrl(
    donationImage: SignableDonationImage
  ): Promise<string | null> {
    if (!donationImage.image_key) {
      return null;
    }

    const s3 = await this.getS3();
    const client = await this.getClient();
    const presigner = await this.getPresigner();

    const command = new s3.GetObjectCommand({
      Bucket: donationImage.image_bucket ?? this.bucket,
      Key: donationImage.image_key,
    });

    return presigner.getSignedUrl(client, command, {
      expiresIn: this.signedUrlExpiresIn,
    });
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      return;
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('O arquivo enviado deve ser uma imagem');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('A imagem enviada está vazia');
    }
  }

  private createObjectKey(originalName: string) {
    const safeName = (originalName || 'image')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-');

    return `donations/${randomUUID()}-${safeName}`;
  }

  private get region() {
    const region = process.env.AWS_REGION;

    if (!region) {
      throw new InternalServerErrorException('AWS_REGION não configurada');
    }

    return region;
  }

  private async getClient() {
    if (!this.s3Client) {
      const s3 = await this.getS3();

      this.s3Client = new s3.S3Client({
        region: this.region,
        credentials: this.credentials,
      });
    }

    return this.s3Client;
  }

  private async getS3() {
    if (!this.s3Module) {
      this.s3Module = await import('@aws-sdk/client-s3');
    }

    return this.s3Module;
  }

  private async getPresigner() {
    if (!this.s3PresignerModule) {
      this.s3PresignerModule = await import('@aws-sdk/s3-request-presigner');
    }

    return this.s3PresignerModule;
  }

  private get bucket() {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new InternalServerErrorException('AWS_S3_BUCKET não configurado');
    }

    return bucket;
  }

  private get credentials() {
    const accessKeyId =
      process.env.AWS_ACCESS_KEY_ID ?? process.env.aws_access_key_id;
    const secretAccessKey =
      process.env.AWS_SECRET_ACCESS_KEY ?? process.env.aws_secret_access_key;
    const sessionToken =
      process.env.AWS_SESSION_TOKEN ?? process.env.aws_session_token;

    if (!accessKeyId || !secretAccessKey) {
      return undefined;
    }

    return {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  }

  private get signedUrlExpiresIn() {
    const configuredValue = Number(process.env.AWS_S3_SIGNED_URL_EXPIRES);

    if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
      return MAX_SIGNED_URL_TTL_SECONDS;
    }

    return configuredValue;
  }
}
