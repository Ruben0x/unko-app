-- Rename proposedById → createdById on Item table
ALTER TABLE "Item" RENAME COLUMN "proposedById" TO "createdById";

-- Rename FK constraint to match the new column name
ALTER TABLE "Item" RENAME CONSTRAINT "Item_proposedById_fkey" TO "Item_createdById_fkey";

-- Add new optional fields to Item
ALTER TABLE "Item" ADD COLUMN "location"    TEXT;
ALTER TABLE "Item" ADD COLUMN "externalUrl" TEXT;
