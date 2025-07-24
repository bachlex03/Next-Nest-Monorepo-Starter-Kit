-- DropIndex
DROP INDEX "users_id_key";

-- AlterTable
ALTER TABLE "tokens" ALTER COLUMN "refreshToken" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
