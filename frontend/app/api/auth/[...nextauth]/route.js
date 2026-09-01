import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        Credentials({
            name: "Strapi",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Runs server-side inside the container: prefer the internal
                // service URL (http://backend:1337) over the browser-facing
                // NEXT_PUBLIC_STRAPI_URL, which resolves to the frontend here.
                const strapiUrl =
                    process.env.STRAPI_INTERNAL_URL ||
                    process.env.NEXT_PUBLIC_STRAPI_URL;
                const res = await fetch(
                    `${strapiUrl}/api/auth/local`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            identifier: credentials.email,
                            password: credentials.password,
                        }),
                    }
                );

                const data = await res.json();

                if (!res.ok || !data.jwt) {
                    throw new Error(data.error?.message || "Login failed");
                }

                return {
                    id: data.user.id,
                    name: data.user.username,
                    email: data.user.email,
                    jwt: data.jwt,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.jwt = user.jwt;
                token.id = user.id;
            }
            // Allow the client to push updated profile fields into the session
            // (via useSession().update({ name, email })) after editing them.
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name;
                if (session.email) token.email = session.email;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.jwt = token.jwt;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
