'use client'
import { useEffect, useState } from 'react'

type Msg = { id: string; sender_role: string; alias: string; body: string; created_at: string }

export function QuoteThread({ requestId }: { requestId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')

  async function load() {
    const res = await fetch(`/api/b2b/requests/${requestId}/messages`)
    if (res.ok) setMessages(await res.json())
  }
  useEffect(() => { load() }, [requestId])

  async function send() {
    if (!text.trim()) return
    const res = await fetch(`/api/b2b/requests/${requestId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    if (res.ok) { setText(''); load() }
  }

  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3 text-navy-900">שיחה</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
        {messages.map(m => (
          <div key={m.id} className="text-sm">
            <span className="font-bold text-brand-700">{m.alias}: </span>
            <span className="text-gray-700">{m.body}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-gray-400 text-sm">אין הודעות עדיין</p>}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="input flex-1" placeholder="כתוב הודעה..." />
        <button onClick={send} className="btn-primary">שלח</button>
      </div>
    </div>
  )
}
