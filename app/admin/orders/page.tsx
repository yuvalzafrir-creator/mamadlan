import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'ממתין לתשלום',
  paid: 'שולם',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
}

export default async function AdminOrdersPage() {
  try { await requireRole('admin') } catch { redirect('/') }

  const supabase = createServerSupabaseClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, listings(type), profiles!buyer_id(name, email)')
    .order('created_at', { ascending: false })

  const platformOrders =
    orders?.filter(o => o.shipping_type === 'platform' && o.status === 'paid') ?? []

  return (
    <main className="max-w-5xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">ניהול הזמנות</h1>

      {platformOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <h2 className="font-bold text-yellow-800 mb-2">
            ⚠️ הזמנות הדורשות טיפול — משלוח פלטפורמה ({platformOrders.length})
          </h2>
          <div className="space-y-2">
            {platformOrders.map(o => {
              const buyer = o.profiles as any
              return (
                <div key={o.id} className="bg-white rounded p-3 text-sm">
                  <p><strong>קונה:</strong> {buyer?.name} ({buyer?.email})</p>
                  <p><strong>סוג:</strong> {(o.listings as any)?.type}</p>
                  <p>
                    <strong>עלות משלוח:</strong>{' '}
                    ₪{(o.shipping_amount / 100).toLocaleString('he-IL')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {orders?.map(o => {
          const buyer = o.profiles as any
          return (
            <div key={o.id} className="border rounded p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {buyer?.name} — {(o.listings as any)?.type}
                </p>
                <p className="text-gray-500 text-sm">
                  ₪{((o.amount + o.shipping_amount) / 100).toLocaleString('he-IL')} |{' '}
                  {o.shipping_type === 'platform'
                    ? 'משלוח פלטפורמה'
                    : o.shipping_type === 'seller'
                    ? 'משלוח מוכר'
                    : 'איסוף עצמי'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  o.status === 'paid' || o.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : o.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
