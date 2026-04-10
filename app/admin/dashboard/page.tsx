import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  try { await requireRole('admin') } catch { redirect('/') }

  const supabase = createServerSupabaseClient()
  const [{ count: sellersCount }, { count: listingsCount }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('commission_amount, status'),
  ])

  const totalCommission =
    orders?.filter(o => o.status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.commission_amount, 0) ?? 0

  return (
    <main className="max-w-4xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-8">לוח ניהול</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">מוכרים</p>
          <p className="text-2xl font-bold">{sellersCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">מוצרים פעילים</p>
          <p className="text-2xl font-bold">{listingsCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">עמלות שנגבו</p>
          <p className="text-2xl font-bold">₪{(totalCommission / 100).toLocaleString('he-IL')}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <a href="/admin/sellers" className="bg-blue-600 text-white px-4 py-2 rounded">ניהול מוכרים</a>
        <a href="/admin/orders" className="bg-blue-600 text-white px-4 py-2 rounded">ניהול הזמנות</a>
        <a href="/admin/config" className="bg-gray-600 text-white px-4 py-2 rounded">הגדרות</a>
      </div>
    </main>
  )
}
