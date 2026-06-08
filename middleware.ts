import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = (req.auth?.user as any)?.role

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (pathname.startsWith('/seller') && role !== 'seller' && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/b2b/requests') && !(req.auth?.user as any)?.is_business) {
    return NextResponse.redirect(new URL('/b2b', req.url))
  }
})

export const config = {
  matcher: [
    '/seller/dashboard/:path*', '/seller/listings/:path*', '/seller/onboarding/:path*',
    '/seller/verify/:path*', '/seller/b2b/:path*',
    '/admin/:path*', '/orders/:path*', '/checkout/:path*',
    '/b2b/requests/:path*',
  ],
}
