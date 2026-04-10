'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LanguageToggle() {
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = useState<'he' | 'en'>('he')

  useEffect(() => {
    setCurrentLocale(document.documentElement.lang === 'en' ? 'en' : 'he')
  }, [pathname])

  function toggle() {
    const nextLocale = currentLocale === 'he' ? 'en' : 'he'
    // Strip existing locale prefix if present, then add the new one
    const stripped = pathname.replace(/^\/(he|en)(\/|$)/, '/')
    window.location.href = `/${nextLocale}${stripped}`
  }

  return (
    <button
      onClick={toggle}
      className="text-gray-500 text-sm border rounded px-2 py-1 hover:bg-gray-50"
    >
      {currentLocale === 'he' ? 'EN' : 'עב'}
    </button>
  )
}
