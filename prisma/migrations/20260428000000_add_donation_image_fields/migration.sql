ALTER TABLE "donations"
ADD COLUMN "image_key" VARCHAR(512),
ADD COLUMN "image_bucket" VARCHAR(63),
ADD COLUMN "image_content_type" VARCHAR(100),
ADD COLUMN "image_original_name" VARCHAR(255);
