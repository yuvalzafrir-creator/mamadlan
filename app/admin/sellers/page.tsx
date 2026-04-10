import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSellerActions from './AdminSellerActions'

export default async function AdminSellersPage() {
  try { await requireRole('admin') } catch { redirect('/') }

  const supabase = createServerSupabaseClient()
  const { data: sellers } = await supabase
    .from('profiles')
    .select('*, verification_requests(status, submitted_at)')
    .eq('role', 'seller')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-5xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">ניהול מוכרים</h1>
      <div className="space-y-3">
        {sellers?.map(s => {
          const pendingRequest = (s.verification_requests as any[])?.find(
            r => r.status === 'pending'
          )
          return (
            <div key={s.id} className="border rounded p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {s.business_name}
                  {s.verified && <span className="text-blue-600 text-sm mr-2">✓ מאומת</span>}
                </p>
                <p className="text-gray-500 text-sm">
                  {s.email} {s.business_id && `| ${s.business_id}`}
                </p>
              </div>
              {pendingRequest && <AdminSellerActions sellerId={s.id} />}
            </div>
          )
        })}
        {!sellers?.length && <p className="text-gray-500">אין מוכרים רשומים.</p>}
      </div>
    </main>
  )
}
