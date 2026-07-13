import { DefaultSession } from "next-auth";

// Augment NextAuth's types so our custom fields (jwt, id) are known to TypeScript.
declare module "next-auth" {
  interface Session {
    // Strapi JWT lives at the top level of the session (set in the session callback).
    jwt?: string;
    user: {
      id?: number | string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: number | string;
    jwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number | string;
    jwt?: string;
  }
}
