const ADMIN_EMAIL = 'yuvalzafrir@gmail.com'

// Sends a notification email to the platform admin via Resend.
// Fire-and-forget: never throws, never blocks business logic.
// Without RESEND_API_KEY it logs and returns (local/dev safe).
export async function sendAdminEmail(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[email skipped — no RESEND_API_KEY] ${subject}`)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Mamadlan <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error(`[email failed] ${res.status} ${await res.text()}`)
    }
  } catch (e) {
    console.error('[email failed]', e)
  }
}
