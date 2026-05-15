import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { env } from './lib/env';
import { getStore } from './lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: env.githubClientId(),
      clientSecret: env.githubClientSecret(),
    }),
  ],
  secret: env.authSecret(),
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email ?? profile?.email;
      if (!email) return false;
      const githubId = profile && 'id' in profile ? String(profile.id) : undefined;
      await getStore().upsertUser({ email, githubId });
      return true;
    },
    async jwt({ token, profile, user }) {
      if (profile && 'id' in profile) token.githubId = String(profile.id);
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (token.email) session.user = { ...session.user, email: token.email };
      return session;
    },
  },
});
