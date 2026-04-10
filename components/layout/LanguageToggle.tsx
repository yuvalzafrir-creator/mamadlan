'use client'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()

  function toggle() {
    const currentLang =
      typeof document !== 'undefined' ? document.documentElement.lang : 'he'
    const nextLocale = currentLang === 'he' ? 'en' : 'he'
    // Next.js locale routing: push with locale prefix
    router.push(`/${nextLocale}${pathname}`)
  }

  return (
    <button
      onClick={toggle}
      className="text-gray-500 text-sm border rounded px-2 py-1 hover:bg-gray-50"
    >
      {typeof window !== 'undefined' && document.documentElement.lang === 'he' ? 'EN' : 'עב'}
    </button>
  )
}
