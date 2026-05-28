INSERT INTO "categories" ("id", "name", "measure_unity", "created_at", "active")
SELECT '3f3f3b7a-5e59-4a0a-9f2d-8ce0d76f7a9d', 'Variados', 'UN', CURRENT_TIMESTAMP, true
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" WHERE "name" = 'Variados'
);
