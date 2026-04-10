export default function HowItWorksPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">איך זה עובד?</h1>
      <div className="space-y-8">
        {[
          {
            n: '01',
            title: 'מה זה ממד / מיגונית?',
            body: 'ממד (מרחב מוגן דירתי) ומיגונית הם מבני מיגון ניידים. לאחר המלחמה, עסקים רבים מוכרים אותם במחירים נוחים.',
          },
          {
            n: '02',
            title: 'חיפוש מוצר',
            body: 'השתמש במסנני החיפוש לבחור סוג, מידות, מחיר ואזור גיאוגרפי. ניתן לראות אם המוכר מאומת על ידי האתר.',
          },
          {
            n: '03',
            title: 'תשלום מאובטח',
            body: 'לחץ "לרכישה" בדף המוצר, בחר אפשרות משלוח, והשלם תשלום מאובטח דרך Stripe.',
          },
          {
            n: '04',
            title: 'קבלת המוצר',
            body: 'המוכר מקבל התראה ומסדר משלוח. לאחר קבלת המוצר, הסטטוס מתעדכן. במקרה של בעיה — אנו כאן לעזור.',
          },
        ].map(s => (
          <div key={s.n} className="flex gap-6">
            <div className="text-4xl font-black text-blue-100 w-16 shrink-0">{s.n}</div>
            <div>
              <h2 className="text-xl font-bold mb-2">{s.title}</h2>
              <p className="text-gray-600">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
