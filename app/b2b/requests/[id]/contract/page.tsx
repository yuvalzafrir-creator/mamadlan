import { getSessionUser } from '@/lib/auth'
import { AgreeButton } from './AgreeButton'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ContractPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>

  const rows = await sql`
    SELECT r.*, l.title AS listing_title, l.type AS listing_type, l.price AS listing_price,
           bu.name AS buyer_name, su.business_name AS seller_business_name, su.name AS seller_name
    FROM b2b_requests r
    LEFT JOIN listings l ON l.id = r.listing_id
    LEFT JOIN users bu ON bu.id = r.buyer_id
    LEFT JOIN users su ON su.id = r.seller_id
    WHERE r.id = ${params.id} LIMIT 1
  `
  const r = rows[0]
  if (!r) return <main dir="rtl" className="p-12">לא נמצא</main>

  const role = (user as any).role
  const isBuyer = r.buyer_id === user.id
  const isSeller = r.seller_id === user.id
  if (!isBuyer && !isSeller && role !== 'admin') return <main dir="rtl" className="p-12">אין גישה</main>

  const qty = r.quantity ?? 1
  const unit = r.listing_price ?? 0
  const total = unit * qty
  const fmt = (v: number) => '₪' + (v / 100).toLocaleString('he-IL')
  const shippingLine = !r.wants_shipping
    ? 'ללא משלוח (איסוף בתיאום)'
    : r.seller_shipping_price != null
      ? `משלוח על ידי המוכר — ${fmt(r.seller_shipping_price)} אל: ${r.delivery_address ?? ''}`
      : `משלוח אל: ${r.delivery_address ?? ''} — המחיר ייקבע על ידי מנהל הפלטפורמה`

  const contractReady = ['seller_confirmed', 'pending_admin', 'closed_won'].includes(r.status)

  return (
    <main dir="rtl" className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-2xl font-black text-navy-900">הסכם עסקה</h1>
      {!contractReady ? (
        <p className="text-gray-500">החוזה יהיה זמין לאחר אישור זמינות מהמוכר.</p>
      ) : (
        <>
          <div className="card p-6 space-y-3 text-sm leading-relaxed">
            <p className="text-xs text-gray-400">נוצר אוטומטית מתנאי העסקה · {new Date(r.created_at).toLocaleDateString('he-IL')}</p>
            <p><b>הקונה:</b> {r.org_name ?? r.buyer_name} {r.contact_name ? `(איש קשר: ${r.contact_name})` : ''}</p>
            <p><b>המוכר:</b> {r.seller_business_name ?? r.seller_name}</p>
            <hr className="border-gray-100" />
            <p><b>המוצר:</b> {r.listing_title ?? r.listing_type ?? r.shelter_type}</p>
            <p><b>כמות:</b> {qty}</p>
            <p><b>מחיר ליחידה:</b> {fmt(unit)}</p>
            <p><b>סה&quot;כ:</b> {fmt(total)}</p>
            <p><b>משלוח:</b> {shippingLine}</p>
            {r.target_date && <p><b>מועד אספקה מבוקש:</b> {new Date(r.target_date).toLocaleDateString('he-IL')}</p>}
            <hr className="border-gray-100" />
            <p className="text-gray-500">העסקה תיסגר ותאושר סופית על ידי מנהל הפלטפורמה לאחר אישור שני הצדדים. התשלום יוסדר מחוץ לפלטפורמה בהתאם לתנאים אלו.</p>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">הקונה</span>
              {r.buyer_agreed_at
                ? <span className="text-green-700 text-sm font-bold">✓ אושר {new Date(r.buyer_agreed_at).toLocaleDateString('he-IL')}</span>
                : <span className="text-gray-400 text-sm">ממתין לאישור</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">המוכר</span>
              {r.seller_agreed_at
                ? <span className="text-green-700 text-sm font-bold">✓ אושר {new Date(r.seller_agreed_at).toLocaleDateString('he-IL')}</span>
                : <span className="text-gray-400 text-sm">ממתין לאישור</span>}
            </div>
            {r.status === 'seller_confirmed' && (isBuyer || isSeller) && (
              <AgreeButton requestId={params.id} alreadyAgreed={isBuyer ? !!r.buyer_agreed_at : !!r.seller_agreed_at} />
            )}
            {r.status === 'pending_admin' && <p className="text-brand-700 font-bold text-sm">שני הצדדים אישרו — העסקה ממתינה לאישור המנהל</p>}
            {r.status === 'closed_won' && <p className="text-green-700 font-bold text-sm">העסקה נסגרה ✓</p>}
          </div>
        </>
      )}
    </main>
  )
}
