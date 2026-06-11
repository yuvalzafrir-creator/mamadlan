import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white mt-16" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">מ</span>
              </div>
              <span className="font-black text-lg">ממ&quot;דלן</span>
            </div>
            <p className="text-navy-300 text-sm leading-relaxed">
              השוק המוביל לממ&quot;דים ומיגוניות יד שנייה בישראל. רכישה בטוחה, מוכרים מאומתים, משלוח נוח.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-3 text-navy-100">ניווט מהיר</h3>
            <ul className="space-y-2 text-sm text-navy-300">
              <li><Link href="/listings" className="hover:text-white transition-colors">מוצרים למכירה</Link></li>
              <li><Link href="/shelters-guide" className="hover:text-white transition-colors">מדריך מיגון</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">איך זה עובד?</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">אודות</Link></li>
              <li><Link href="/seller/register" className="hover:text-white transition-colors">הרשמה כמוכר</Link></li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h3 className="font-bold mb-3 text-navy-100">אמון ובטיחות</h3>
            <ul className="space-y-2 text-sm text-navy-300">
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> מוכרים עוברים אימות
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> תשלום מאובטח דרך Stripe
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> הגנת קונה מובנית
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> תמיכה בעברית
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-navy-400">
          <p>© {new Date().getFullYear()} ממ&quot;דלן. כל הזכויות שמורות.</p>
          <p>תשלומים מאובטחים על ידי Stripe</p>
        </div>
      </div>
    </footer>
  )
}
