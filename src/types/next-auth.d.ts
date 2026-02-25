import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Mirrors UserStatus enum from the DB */
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    status?: string;
  }
}
