DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'EventStatus'
    ) THEN
        CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');
    END IF;
END $$;

ALTER TABLE "events"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "events"
ALTER COLUMN "status" TYPE "EventStatus"
USING (
    CASE
        WHEN UPPER(
            TRANSLATE(
                TRIM("status"),
                'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
            )
        ) IN ('ABERTO', 'ATIVO', 'SCHEDULED')
            THEN 'SCHEDULED'::"EventStatus"
        WHEN UPPER(
            TRANSLATE(
                TRIM("status"),
                'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
            )
        ) IN ('CONCLUIDO', 'COMPLETED')
            THEN 'COMPLETED'::"EventStatus"
        WHEN UPPER(
            TRANSLATE(
                TRIM("status"),
                'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
            )
        ) IN ('CANCELADO', 'CANCELED')
            THEN 'CANCELED'::"EventStatus"
        ELSE 'SCHEDULED'::"EventStatus"
    END
);

ALTER TABLE "events"
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
