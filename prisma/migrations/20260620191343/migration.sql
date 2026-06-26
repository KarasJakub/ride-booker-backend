-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'ACCOUNT_CREATED', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('USER', 'BRANCH_ADMIN');

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "event_type" "NotificationEventType" NOT NULL,
    "recipient" "NotificationRecipientType" NOT NULL,
    "title" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "location_id" TEXT,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
