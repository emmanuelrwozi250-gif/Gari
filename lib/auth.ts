import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { compare, hash } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar || user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        // Fetch renterType + foreignVerified from DB on sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { renterType: true, foreignVerified: true, nationality: true },
        }).catch(() => null);
        if (dbUser) {
          token.renterType = dbUser.renterType;
          token.foreignVerified = dbUser.foreignVerified;
          token.nationality = dbUser.nationality;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).renterType = token.renterType ?? 'LOCAL';
        (session.user as any).foreignVerified = token.foreignVerified ?? false;
        (session.user as any).nationality = token.nationality ?? null;
      }
      return session;
    },
  },
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}
