-- Recreate UserStatus enum with new values (INVITED, ACTIVE, DISABLED, DELETED)
-- Safe because the User table has no rows at this point.

-- Step 1: Drop the default that references the old enum
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;

-- Step 2: Create the new enum
CREATE TYPE "UserStatus_new" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED', 'DELETED');

-- Step 3: Migrate the column to the new enum type
ALTER TABLE "User"
  ALTER COLUMN "status" TYPE "UserStatus_new"
  USING ("status"::text::"UserStatus_new");

-- Step 4: Set the new default
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'INVITED'::"UserStatus_new";

-- Step 5: Drop the old enum and rename the new one
DROP TYPE "UserStatus";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
