-- CreateTable
CREATE TABLE "Check" (
    "id"        TEXT NOT NULL,
    "photoUrl"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId"    TEXT NOT NULL,
    "itemId"    TEXT NOT NULL,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (enforces one check per user per item)
CREATE UNIQUE INDEX "Check_userId_itemId_key" ON "Check"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
