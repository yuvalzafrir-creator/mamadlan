import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface CookieOption {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieOption[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*', '/orders/:path*', '/checkout/:path*'],
}
