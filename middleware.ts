import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      throw new Error('JWT_SECRET environment variable is required in production')
    }
    return new TextEncoder().encode('UNSAFE-DEV-SECRET-DO-NOT-USE-IN-PRODUCTION')
  }
  return new TextEncoder().encode(secret)
}
const JWT_SECRET = getJwtSecret()
const COOKIE_NAME = 'kolio_session'

const publicPaths = ['/', '/login', '/api/auth/login', '/api/auth/logout', '/api/webhooks', '/api/health']

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

// Static assets and Next.js internals
function isStaticPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
