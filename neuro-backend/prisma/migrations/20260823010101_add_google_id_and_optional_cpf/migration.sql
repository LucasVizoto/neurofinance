-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "cpf" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "public"."users"("google_id");
