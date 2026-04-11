export default function HowItWorksPage() {
  const steps = [
    {
      n: '01',
      icon: '🔍',
      title: 'חפש מוצר',
      body: 'סנן לפי סוג (ממ"ד / מיגונית), מידות, מחיר ואזור גיאוגרפי. כל מוצר מציג תג אימות למוכרים שעברו בדיקה.',
      color: 'bg-brand-50 text-brand-600',
    },
    {
      n: '02',
      icon: '✅',
      title: 'בחר ובדוק',
      body: 'קרא את פרטי המוצר, ראה תמונות, ובדוק שהמוכר מאומת. ניתן לפנות למוכר ישירות לשאלות.',
      color: 'bg-green-50 text-green-600',
    },
    {
      n: '03',
      icon: '💳',
      title: 'שלם בבטחה',
      body: 'לחץ "לרכישה", בחר אפשרות משלוח, והשלם תשלום מאובטח דרך Stripe. הכסף מוחזק עד לאישור קבלה.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      n: '04',
      icon: '🚛',
      title: 'קבל את המוצר',
      body: 'המוכר מקבל התראה ומסדר משלוח. לאחר קבלת המוצר הסטטוס מתעדכן. במקרה של בעיה — אנו כאן לעזור.',
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <main dir="rtl" className="bg-gray-50">
      {/* Hero */}
      <section className="bg-hero-gradient text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-black mb-3">איך זה עובד?</h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto">
          קנייה בטוחה ופשוטה בארבעה שלבים
        </p>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={s.n} className="card p-6 flex gap-6 items-start hover:shadow-card-hover transition-shadow">
              <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-2xl shrink-0`}>
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-bold text-gray-300">{s.n}</span>
                  <h2 className="text-xl font-black text-navy-900">{s.title}</h2>
                </div>
                <p className="text-gray-500 leading-relaxed">{s.body}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden sm:flex absolute right-10 mt-20 text-gray-200 text-2xl select-none">↓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sellers section */}
      <section className="bg-navy-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-black mb-3">אתה מוכר?</h2>
        <p className="text-navy-300 text-lg mb-8 max-w-xl mx-auto">
          הצטרף לפלטפורמה ופרסם את הממ&quot;ד שלך תוך דקות. הרשמה חינמית.
        </p>
        <a
          href="/seller/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors text-lg"
        >
          הרשמה כמוכר ←
        </a>
      </section>
    </main>
  )
}
