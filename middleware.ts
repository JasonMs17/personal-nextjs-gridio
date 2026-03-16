import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    // Stop retry loop - if error on getSession, don't retry
    if (error) {
      console.error('Session check error:', error.message)
      // Continue without session to avoid infinite retry
    }

    const pathname = req.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/login')

    // Redirect unauthenticated users to login
    if (!session && !isAuthRoute) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Prevent logged-in users from visiting login
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Return response to avoid infinite error loops
    return res
  }
}

export const config = {
  matcher: [
    // Match all paths except:
    '/((?!api|_next/static|_next/image|favicon.ico|public|.well-known).*)',
  ]
}
