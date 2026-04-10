'use client'
import { useEffect, useState } from 'react'

export default function AdminConfigPage() {
  const [config, setConfig] = useState({ commission_rate: 10, platform_shipping_price: 50000 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/config').then(r => r.json()).then(setConfig)
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main className="max-w-md mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">הגדרות פלטפורמה</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">עמלה (%)</label>
          <input
            type="number"
            step="0.1"
            value={config.commission_rate}
            onChange={e => setConfig(c => ({ ...c, commission_rate: parseFloat(e.target.value) }))}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">מחיר משלוח פלטפורמה (אגורות)</label>
          <input
            type="number"
            value={config.platform_shipping_price}
            onChange={e =>
              setConfig(c => ({ ...c, platform_shipping_price: parseInt(e.target.value) }))
            }
            className="w-full border rounded p-2"
          />
          <p className="text-gray-400 text-xs mt-1">
            ₪{(config.platform_shipping_price / 100).toLocaleString('he-IL')}
          </p>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          שמור
        </button>
        {saved && <p className="text-green-600 text-sm text-center">נשמר!</p>}
      </form>
    </main>
  )
}
