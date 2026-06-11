const STEPS = ['הוגשה', 'אישור מוכר', 'חוזה', 'בדיקת מנהל', 'נסגרה']

// Maps a b2b_requests.status to the current phase index + state.
function phaseOf(status: string): { index: number; failed: boolean; done: boolean } {
  switch (status) {
    case 'new': return { index: 0, failed: false, done: false }
    case 'qualifying':
    case 'sourcing': return { index: 1, failed: false, done: false }
    case 'quoting':
    case 'presented': return { index: 2, failed: false, done: false }
    case 'seller_confirmed': return { index: 2, failed: false, done: false }
    case 'pending_admin': return { index: 3, failed: false, done: false }
    case 'closed_won': return { index: 4, failed: false, done: true }
    case 'seller_declined': return { index: 1, failed: true, done: false }
    case 'closed_lost':
    case 'cancelled': return { index: 3, failed: true, done: false }
    default: return { index: 0, failed: false, done: false }
  }
}

export function DealProgressBar({ status }: { status: string }) {
  const { index, failed, done } = phaseOf(status)
  return (
    <div className="card p-4">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const reached = i <= index
          const isCurrent = i === index && !done
          const color = failed && i === index
            ? 'bg-red-500 text-white'
            : reached
              ? (done || !isCurrent ? 'bg-brand-600 text-white' : 'bg-amber-500 text-white')
              : 'bg-gray-200 text-gray-500'
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
                  {failed && i === index ? '✕' : reached && (done || !isCurrent) ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${reached ? 'text-navy-900 font-semibold' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < index ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
