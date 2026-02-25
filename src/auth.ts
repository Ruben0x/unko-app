import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { status: true },
      });

      // Returning ACTIVE user — allow directly
      if (existingUser?.status === "ACTIVE") return true;

      // ── Bootstrap ────────────────────────────────────────────────────────────
      // If the User table is empty, the first sign-in creates the initial user.
      // All subsequent users require an invitation.
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        try {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              status: "ACTIVE",
            },
          });
          return true;
        } catch {
          // Race condition: another user was created between count and create.
          // Fall through to the invitation check.
        }
      }

      // ── Invitation gate ───────────────────────────────────────────────────────
      const invitation = await prisma.invitation.findFirst({
        where: {
          email: user.email,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (!invitation) return false;

      // Accept the invitation and activate the user atomically
      await prisma.$transaction(async (tx) => {
        const activatedUser = await tx.user.upsert({
          where: { email: user.email! },
          create: {
            email: user.email!,
            name: user.name ?? null,
            image: user.image ?? null,
            status: "ACTIVE",
          },
          update: { status: "ACTIVE" },
        });

        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            acceptedById: activatedUser.id,
          },
        });
      });

      return true;
    },
  },
});
