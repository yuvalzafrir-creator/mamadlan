import Link from 'next/link'

export const metadata = {
  title: 'מדריך מבני מיגון בישראל | ממ"דלן',
  description: 'מידע מקיף על ממ"דים, מיגוניות ומחסות — סוגים, תקנות, דרישות חוקיות ורגולציה של פיקוד העורף בישראל.',
}

const STATS = [
  { value: '2.5M+', label: 'ממ"דים בישראל', sub: 'נכון ל-2024' },
  { value: '8 שנ׳', label: 'גיל ממוצע של ממ"ד', sub: 'בנוי לפני 2016' },
  { value: '94%', label: 'כיסוי מגורים', sub: 'בניינים חדשים' },
  { value: '12 שנ׳', label: 'חיי שירות מוצהרים', sub: 'למיגונית תקנית' },
]

const SHELTERS = [
  {
    id: 'mamad',
    title: 'ממ"ד — מרחב מוגן דירתי',
    icon: '🏠',
    color: 'bg-brand-50 border-brand-200',
    headerColor: 'bg-brand-600',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    description: 'חדר מוגן המשולב בדירת המגורים, בנוי מבטון מזוין ומצויד בדלת ותריס פלדה. מספק הגנה מפני פגיעה ישירה ועקיפה.',
    specs: [
      { label: 'שטח מינימלי', value: '9 מ"ר (תקן 4366)' },
      { label: 'עובי קירות', value: '30 ס"מ בטון מזוין' },
      { label: 'גובה תקרה', value: '2.5 מ׳ לפחות' },
      { label: 'אוורור', value: 'מסנן NBC חובה' },
      { label: 'פתח', value: 'דלת פלדה תקנית + תריס' },
    ],
    regulations: [
      'חובה בכל דירה חדשה מ-1992',
      'תקן ישראלי 4366 ותיקון 2011',
      'אישור פיקוד העורף לפני אכלוס',
      'בדיקה תקופתית אחת לשנה',
      'חלק בלתי נפרד מהמבנה — לא ניתן לפירוק או למכירה יד שנייה',
    ],
    badge: 'לא ניתן למכירה',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    id: 'migounit',
    title: 'מיגונית — מבנה מיגון נייד',
    icon: '🏗️',
    color: 'bg-amber-50 border-amber-200',
    headerColor: 'bg-amber-600',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
    description: 'מבנה פלדה עצמאי וניתן להזזה, מיועד לשטחים פתוחים, מפעלים, בתי ספר ואתרי בנייה. ניתן להציב בכל מקום שיש אפשרות גישה.',
    specs: [
      { label: 'סוגים עיקריים', value: 'אחיד / מחולק / דו-מפלס' },
      { label: 'חומר', value: 'פלדה מגולוונת 4–8 מ"מ' },
      { label: 'גודל סטנדרטי', value: '2.2×2.5×2.4 מ׳' },
      { label: 'עמידות', value: 'שביר עד לא שביר (לפי ייעוד)' },
      { label: 'הצבה', value: 'ללא יסודות — על משטח ישר' },
    ],
    regulations: [
      'תקן ת"י 4364 למיגוניות פלדה',
      'דרוש אישור מהנדס מוסמך',
      'בדיקת תו תקן לפני שימוש',
      'חובת ציון ת.ז. מוצר על הגוף',
      'פטור מהיתר בנייה עד 25 מ"ר',
    ],
    badge: 'גמיש ונייד',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'machse',
    title: 'מחסה — מרחב מוגן ציבורי',
    icon: '🏛️',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-700',
    image: 'https://images.unsplash.com/photo-1565117131620-e11c5e1534d5?w=800&q=80',
    description: 'מבנה תת-קרקעי או חצי-קרקעי המיועד לאוכלוסייה הציבורית. נמצא בבניינים ציבוריים, שכונות ותחנות רכבת.',
    specs: [
      { label: 'שטח', value: 'לפי קיבולת — 1 מ"ר לאדם' },
      { label: 'עומק', value: 'לפחות 0.5 מ׳ מתחת לפני הקרקע' },
      { label: 'אוורור', value: 'מאוורר עם גנרטור גיבוי' },
      { label: 'ציוד', value: 'מים, תרופות, ציוד ראשון עזר' },
      { label: 'גישה', label2: 'נגישות', value: 'נגיש לנכים לפי תקן' },
    ],
    regulations: [
      'חובה בבניינים ציבוריים מ-1950',
      'תקן ת"י 931 למחסות ציבוריים',
      'מינהל הגנה אזרחית אחראי',
      'חובת תחזוקה עירונית',
      'סימון "מחסה" חובה על כניסה',
    ],
    badge: 'ציבורי',
    badgeColor: 'bg-green-100 text-green-700',
  },
]

const FAQS = [
  {
    q: 'האם חובה שיהיה ממ"ד בדירה חדשה?',
    a: 'כן. מ-1992 כל בניין חדש חייב לכלול ממ"ד לכל יחידת דיור, בהתאם לחוק התכנון והבנייה ותקנות פיקוד העורף.',
  },
  {
    q: 'האם מותר למכור ממ"ד בנפרד מהדירה?',
    a: 'ממ"ד משולב בדירה הוא חלק בלתי נפרד ממנה ולא ניתן למכירה בנפרד. מיגוניות עצמאיות ניתנות למכירה ולהעברה.',
  },
  {
    q: 'מה בודקים כשקונים מיגונית יד שנייה?',
    a: 'יש לבדוק: תו תקן בתוקף, אין חלודה מבנית, הדלת נסגרת בצורה אטומה, המסנן תקין, ואין עיוותים בקירות.',
  },
  {
    q: 'מי אחראי על תחזוקת מחסה ציבורי?',
    a: 'הרשות המקומית אחראית על תחזוקת מחסות ציבוריים. תלונות ניתן להפנות לפיקוד העורף או לעירייה.',
  },
  {
    q: 'האם נדרש היתר בנייה להצבת מיגונית?',
    a: 'מיגונית עד 25 מ"ר פטורה מהיתר בנייה. מעל לכך נדרש היתר מהוועדה המקומית לתכנון ובנייה.',
  },
]

export default function SheltersGuidePage() {
  return (
    <main dir="rtl" className="bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-white py-24 px-6 text-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>🛡️</span>
            פיקוד העורף — מדריך רשמי
          </div>
          <h1 className="text-5xl font-black mb-4">מדריך מבני מיגון<br /><span className="text-amber-400">בישראל</span></h1>
          <p className="text-xl text-blue-100 max-w-xl mx-auto">
            כל מה שצריך לדעת על ממ"דים, מיגוניות ומחסות — תקנות, מידות, זכויות ורגולציה.
          </p>
        </div>
      </section>

      {/* Statistics bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-brand-600">{s.value}</p>
              <p className="text-sm font-semibold text-navy-900 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shelter types */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand-600 mb-2">סוגי מבני מיגון</p>
          <h2 className="text-3xl font-black text-navy-900">מה ההבדל בין הסוגים?</h2>
        </div>

        <div className="space-y-12">
          {SHELTERS.map((shelter, idx) => (
            <div key={shelter.id} className={`card overflow-hidden border ${shelter.color}`}>
              <div className={`${shelter.headerColor} text-white px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{shelter.icon}</span>
                  <h3 className="text-xl font-black">{shelter.title}</h3>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${shelter.badgeColor} bg-white/90`}>
                  {shelter.badge}
                </span>
              </div>

              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${idx % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className="relative h-56 lg:h-auto overflow-hidden">
                  <img
                    src={shelter.image}
                    alt={shelter.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-gray-600 leading-relaxed">{shelter.description}</p>

                  <div>
                    <h4 className="font-bold text-navy-900 mb-3 text-sm uppercase tracking-wide">מפרט טכני</h4>
                    <div className="space-y-2">
                      {shelter.specs.map(spec => (
                        <div key={spec.label} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-500">{spec.label}</span>
                          <span className="text-sm font-semibold text-navy-900">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-navy-900 mb-3 text-sm uppercase tracking-wide">תקנות ורגולציה</h4>
                    <ul className="space-y-1.5">
                      {shelter.regulations.map(reg => (
                        <li key={reg} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                          {reg}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regulations overview */}
      <section className="bg-navy-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-brand-400 mb-2">פיקוד העורף</p>
            <h2 className="text-3xl font-black">תקנות ורגולציה בישראל</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: '📜',
                title: 'חוק ותכנון',
                body: 'חוק התכנון והבנייה (תשכ"ה-1965) ותקנותיו מחייבים מרחבים מוגנים בכל בנייה חדשה למגורים ולמסחר.',
              },
              {
                icon: '🏗️',
                title: 'תקנים ישראליים',
                body: 'תקן ת"י 4366 (ממ"ד), ת"י 4364 (מיגונית פלדה), ת"י 931 (מחסה ציבורי) — כל אחד מגדיר דרישות מינימום מחייבות.',
              },
              {
                icon: '🛡️',
                title: 'פיקוח ואכיפה',
                body: 'פיקוד העורף מפקח על יישום התקנים, מוציא היתרים ומאשר מבני מיגון. ועדות תכנון מקומיות אחראיות לאכיפה.',
              },
            ].map(r => (
              <div key={r.title} className="bg-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-4">{r.icon}</div>
                <h3 className="font-bold text-lg mb-2">{r.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-600 mb-2">שאלות נפוצות</p>
          <h2 className="text-3xl font-black text-navy-900">שאלות ותשובות</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map(faq => (
            <details key={faq.q} className="card p-5 group cursor-pointer">
              <summary className="font-bold text-navy-900 flex items-center justify-between list-none">
                {faq.q}
                <span className="text-brand-600 text-xl font-light ml-4 shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-black mb-4">מחפשים מיגונית?</h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          ממ"ד הוא חלק מהמבנה ולא ניתן למכירה — אבל מיגוניות ניידות אפשר לקנות ולהעביר. עיינו במוצרים ממוכרים מאומתים.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/listings?type=migounit"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-glass text-lg"
          >
            מיגוניות למכירה ←
          </Link>
        </div>
      </section>
    </main>
  )
}
