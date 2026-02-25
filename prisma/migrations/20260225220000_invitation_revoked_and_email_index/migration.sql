-- Add REVOKED value to InvitationStatus enum
ALTER TYPE "InvitationStatus" ADD VALUE 'REVOKED';

-- Remove the unique constraint on Invitation.email
-- (allows re-invitation after expiry/revocation and keeps invitation history)
DROP INDEX "Invitation_email_key";

-- Add a regular index on Invitation.email for query performance
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");
