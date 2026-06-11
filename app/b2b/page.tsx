import Link from 'next/link'

export default function B2BLandingPage() {
  return (
    <main dir="rtl" className="max-w-5xl mx-auto px-6 py-16">
      <section className="text-center mb-12">
        <p className="text-sm font-semibold text-brand-600 mb-2">רכש לארגונים</p>
        <h1 className="text-4xl font-black text-navy-900 mb-4">פתרונות מיגון לחברות ולרשויות</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          צריכים כמות גדולה של ממ&quot;דים או מיגוניות? נהל תהליך רכש מסודר: שלחו בקשה, קבלו הצעות מחיר ממוכרים מאומתים, ונהלו משא ומתן — הכל במקום אחד.
        </p>
        <Link href="/b2b/request" className="btn-primary mt-8 inline-flex">שלחו בקשת רכש ←</Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: '📝', title: 'שלחו בקשה', body: 'תארו את הצורך — כמות, אזור, מועד אספקה.' },
          { icon: '💬', title: 'קבלו הצעות', body: 'אנחנו מתאימים מוכרים מאומתים ואוספים הצעות מחיר.' },
          { icon: '🤝', title: 'סגרו עסקה', body: 'נהלו משא ומתן וסגרו ישירות מול הספק, עם ליווי שלנו.' },
        ].map(c => (
          <div key={c.title} className="card p-6 text-center">
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="font-bold text-lg mb-2 text-navy-900">{c.title}</h3>
            <p className="text-sm text-gray-500">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="text-center">
        <Link href="/listings" className="btn-secondary">או עיינו בקטלוג ←</Link>
      </section>
    </main>
  )
}
