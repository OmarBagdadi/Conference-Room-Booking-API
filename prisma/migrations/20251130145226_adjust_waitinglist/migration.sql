/*
  Warnings:

  - You are about to drop the column `desiredEndTime` on the `WaitingList` table. All the data in the column will be lost.
  - You are about to drop the column `desiredStartTime` on the `WaitingList` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `WaitingList` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `WaitingList` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `WaitingList` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingId` to the `WaitingList` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WaitingList" DROP CONSTRAINT "WaitingList_roomId_fkey";

-- DropForeignKey
ALTER TABLE "WaitingList" DROP CONSTRAINT "WaitingList_userId_fkey";

-- AlterTable
ALTER TABLE "WaitingList" DROP COLUMN "desiredEndTime",
DROP COLUMN "desiredStartTime",
DROP COLUMN "roomId",
DROP COLUMN "userId",
ADD COLUMN     "bookingId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_bookingId_key" ON "WaitingList"("bookingId");

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
