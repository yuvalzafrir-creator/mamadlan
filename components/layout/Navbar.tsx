'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { LanguageToggle } from './LanguageToggle'

export function Navbar() {
  const { data: session } = useSession()
  const user = session?.user ?? null
  const role = (user as any)?.role ?? null
  const [open, setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  async function logout() {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/listings',       label: 'מוצרים' },
    { href: '/shelters-guide', label: 'מדריך מיגון' },
    { href: '/how-it-works',   label: 'איך זה עובד?' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass shadow-glass border-b border-white/20' : 'bg-transparent'
        }`}
        style={{ height: 'var(--navbar-h)' }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4" dir="rtl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">מ</span>
            </div>
            <span className="font-black text-lg text-navy-900 hidden sm:block">ממ&quot;דלן</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`btn-ghost text-sm ${pathname === l.href ? 'text-brand-600 bg-brand-50' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {(role === 'buyer' || role === null) && (
                  <Link href="/orders" className="btn-ghost text-sm">הזמנות</Link>
                )}
                {role === 'seller' && (
                  <Link href="/seller/dashboard" className="btn-ghost text-sm">לוח המוכר</Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/dashboard" className="btn-ghost text-sm">ניהול</Link>
                )}
                <button onClick={logout} className="btn-ghost text-sm text-gray-500">יציאה</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">כניסה</Link>
                <Link href="/seller/register" className="btn-primary text-sm">הרשמה כמוכר</Link>
              </>
            )}
            <LanguageToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="תפריט"
          >
            <div className={`w-5 h-0.5 bg-navy-900 transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-navy-900 my-1 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-navy-900 transition-all duration-300 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </nav>
      </header>

      {/* Navbar height spacer */}
      <div style={{ height: 'var(--navbar-h)' }} />

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" />
          <div
            className="absolute top-[var(--navbar-h)] right-0 left-0 glass border-b border-gray-200 p-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="btn-ghost text-base justify-start">
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2" />
              {user ? (
                <>
                  {(role === 'buyer' || role === null) && (
                    <Link href="/orders" className="btn-ghost text-base justify-start">הזמנות</Link>
                  )}
                  {role === 'seller' && (
                    <Link href="/seller/dashboard" className="btn-ghost text-base justify-start">לוח המוכר</Link>
                  )}
                  {role === 'admin' && (
                    <Link href="/admin/dashboard" className="btn-ghost text-base justify-start">ניהול</Link>
                  )}
                  <button onClick={logout} className="btn-ghost text-base justify-start text-gray-500">יציאה</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost text-base justify-start">כניסה</Link>
                  <Link href="/seller/register" className="btn-primary text-base justify-center mt-1">הרשמה כמוכר</Link>
                </>
              )}
              <div className="mt-2 flex justify-end">
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
