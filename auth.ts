import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const rows = await sql`SELECT * FROM users WHERE email = ${credentials.email as string} LIMIT 1`
        const user = rows[0]
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified,
          is_business: user.is_business,
          stripe_account_id: user.stripe_account_id,
          business_name: user.business_name,
          onboarding_step: user.onboarding_step,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.verified = (user as any).verified
        token.is_business = (user as any).is_business
        token.stripe_account_id = (user as any).stripe_account_id
        token.business_name = (user as any).business_name
        token.onboarding_step = (user as any).onboarding_step
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).verified = token.verified
        ;(session.user as any).is_business = token.is_business
        ;(session.user as any).stripe_account_id = token.stripe_account_id
        ;(session.user as any).business_name = token.business_name
        ;(session.user as any).onboarding_step = token.onboarding_step
      }
      return session
    },
  },
})
