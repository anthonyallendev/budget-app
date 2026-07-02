const FROM = 'Retirely <hello@retirely.money>'
const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

async function send({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Resend error ${res.status}`)
  }
  return res.json()
}

// ── Template helpers ──────────────────────────────────────────────────────────

function baseTemplate(body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060b1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:rgba(255,255,255,0.03);border:1px solid rgba(0,212,255,0.12);border-radius:16px;overflow:hidden;">
    <div style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:20px;font-weight:700;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Retirely</span>
    </div>
    <div style="padding:28px 32px 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
      ${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);font-size:12px;color:#475569;text-align:center;">
      © ${new Date().getFullYear()} Retirely · <a href="${APP_URL}/privacy" style="color:#475569;">Privacy Policy</a>
    </div>
  </div>
</body>
</html>`
}

function btn(label, url) {
  return `<a href="${url}" style="display:inline-block;margin:20px 0 8px;padding:12px 28px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">${label}</a>`
}

function h1(text) {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;">${text}</h1>`
}

// ── Email templates ───────────────────────────────────────────────────────────

export function inviteEmail({ referrerName, referralLink }) {
  return {
    subject: `${referrerName} invited you to try Retirely — free financial dashboard`,
    html: baseTemplate(`
      ${h1(`${referrerName} thinks you'd love Retirely`)}
      <p>Hey! <strong style="color:#f1f5f9;">${referrerName}</strong> has been using Retirely to track their savings, budget, and retirement goals — and they wanted to share it with you.</p>
      <p>Retirely is a <strong style="color:#f1f5f9;">free personal finance platform</strong> that helps you:</p>
      <ul style="padding-left:20px;color:#94a3b8;">
        <li>See your retirement age in real time</li>
        <li>Track your budget, savings goals & net worth</li>
        <li>Build better money habits with daily check-ins</li>
      </ul>
      ${btn('Get started free →', referralLink)}
      <p style="font-size:13px;color:#64748b;margin-top:24px;">No credit card required. Free forever, with optional Premium for bank sync and reports.</p>
    `),
  }
}

export function reminderEmail({ referrerName, referralLink, unsubscribeUrl }) {
  return {
    subject: `Reminder: ${referrerName} invited you to Retirely`,
    html: baseTemplate(`
      ${h1('Your invite is still waiting')}
      <p><strong style="color:#f1f5f9;">${referrerName}</strong> invited you to join Retirely — a free personal finance app to help you save smarter and retire sooner.</p>
      ${btn('Join Retirely free →', referralLink)}
      <p style="font-size:12px;color:#475569;margin-top:28px;">
        You received this because ${referrerName} shared your email with us.<br>
        <a href="${unsubscribeUrl}" style="color:#475569;">Unsubscribe from these reminders</a>
      </p>
    `),
  }
}

export function creditEarnedEmail({ referrerName, totalCredits }) {
  return {
    subject: `You just earned $1 — someone subscribed with your referral link!`,
    html: baseTemplate(`
      ${h1('🎉 You earned $1 in referral credit!')}
      <p>Hey ${referrerName}, someone just subscribed to Retirely Premium using your referral link.</p>
      <p>Your <strong style="color:#00d4ff;">$1 credit</strong> has been applied to your account and will reduce your next subscription payment.</p>
      <p style="color:#f1f5f9;"><strong>Total credits earned so far: $${(totalCredits / 100).toFixed(0)}</strong></p>
      <p>Keep sharing your link — at <strong style="color:#00d4ff;">9 referrals</strong> your subscription is free, and beyond that we'll pay you!</p>
      ${btn('View your referrals →', `${APP_URL}/referrals`)}
    `),
  }
}

export { send }
