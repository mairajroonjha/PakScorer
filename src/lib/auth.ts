import { compare } from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types/domain";

function getAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
}

function googleProviderEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function findOrCreateGoogleUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: params.email }
  });

  if (existing) {
    if ((params.name && existing.name !== params.name) || params.image !== existing.image) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: params.name ?? existing.name,
          image: params.image ?? existing.image
        }
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: params.email,
      name: params.name ?? params.email.split("@")[0],
      image: params.image ?? undefined,
      role: "PUBLIC_VIEWER",
      regionId: "bela"
    }
  });
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          role: true,
          regionId: true
        }
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        regionId: user.regionId
      };
    }
  })
];

if (googleProviderEnabled()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (account?.provider === "google") {
        const email = token.email ?? user?.email ?? (typeof profile?.email === "string" ? profile.email : undefined);
        if (email) {
          const dbUser = await findOrCreateGoogleUser({
            email,
            name: typeof token.name === "string" ? token.name : user?.name,
            image: typeof token.picture === "string" ? token.picture : user?.image
          });
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.regionId = dbUser.regionId;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image ?? token.picture;
        }
        return token;
      }

      if (trigger === "update") {
        if (session && typeof session === "object") {
          const nextRole = "role" in session ? session.role : undefined;
          const nextRegionId = "regionId" in session ? session.regionId : undefined;

          if (typeof nextRole === "string") {
            token.role = nextRole as Role;
          }

          if (typeof nextRegionId === "string") {
            token.regionId = nextRegionId;
          }
        }

        return token;
      }

      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.regionId = user.regionId;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? "PUBLIC_VIEWER";
        session.user.regionId = (token.regionId as string | undefined) ?? "bela";
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    }
  }
};

export async function getAppSession() {
  return getServerSession(authOptions);
}

export function isGoogleAuthEnabled(): boolean {
  return googleProviderEnabled();
}
