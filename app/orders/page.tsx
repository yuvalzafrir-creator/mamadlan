import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'
import { redirect } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'ממתין לתשלום',
  paid: 'שולם',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
}

export default async function OrdersPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const orders = await sql`
    SELECT o.*, l.type as listing_type, l.title as listing_title, l.price as listing_price
    FROM orders o LEFT JOIN listings l ON l.id = o.listing_id
    WHERE o.buyer_id = ${user.id!}
    ORDER BY o.created_at DESC
  `

  return (
    <main className="max-w-3xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">ההזמנות שלי</h1>
      {orders.length === 0 && <p className="text-gray-500">אין הזמנות עדיין.</p>}
      <div className="space-y-4">
        {orders.map((o: any) => (
          <div key={o.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{{ migounit: 'מיגונית', other: 'אחר' }[o.listing_type as string] ?? o.listing_type}</p>
                {o.listing_title && <p className="text-gray-500 text-sm">{o.listing_title}</p>}
                <p className="font-bold mt-1">₪{((o.amount + o.shipping_amount) / 100).toLocaleString('he-IL')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                o.status === 'paid' || o.status === 'delivered' ? 'bg-green-100 text-green-700'
                : o.status === 'cancelled' ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
              }`}>
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
