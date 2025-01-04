-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "orderId" INTEGER;

-- CreateIndex
CREATE INDEX "Message_orderId_idx" ON "Message"("orderId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
