import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "MuMu <hello@mumu.shop>";

// Graceful no-op if RESEND_API_KEY is not configured
async function send(payload: Parameters<Resend["emails"]["send"]>[0]) {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping:", payload.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send(payload);
    if (error) console.error("[email] send error:", error);
  } catch (err) {
    console.error("[email] unexpected error:", err);
  }
}

// ─── Immediate: withdrawal confirmation ────────────────────────────────────
export async function sendWithdrawalConfirmation({
  to,
  name,
  amount,
  paypalEmail,
}: {
  to: string;
  name: string;
  amount: number;
  paypalEmail: string;
}) {
  await send({
    from: FROM,
    to,
    subject: `Your $${amount.toFixed(2)} withdrawal is on its way`,
    html: withdrawalConfirmationHtml({ name, amount, paypalEmail }),
  });
}

// ─── Day 3: one-more-box nudge ────────────────────────────────────────────
export async function scheduleWithdrawalNudge({
  to,
  name,
  amount,
}: {
  to: string;
  name: string;
  amount: number;
}) {
  const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  await send({
    from: FROM,
    to,
    subject: "One more pull? 👀",
    html: nudgeHtml({ name, amount }),
    scheduledAt: sendAt,
  });
}

// ─── Day 14: win-back offer ────────────────────────────────────────────────
export async function scheduleWinBackEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const sendAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await send({
    from: FROM,
    to,
    subject: "We saved something for you 🎁",
    html: winBackHtml({ name }),
    scheduledAt: sendAt,
  });
}

// ─── Templates ────────────────────────────────────────────────────────────

function shell(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MuMu</title>
</head>
<body style="margin:0;padding:0;background:#FFF5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <!-- Logo -->
    <div style="margin-bottom:32px;">
      <span style="font-size:24px;font-weight:900;color:#7c2d12;letter-spacing:-0.5px;">MuMu</span>
    </div>
    <!-- Card -->
    <div style="background:#fff;border-radius:24px;padding:40px;border:1px solid #fed7aa;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#fb923c;margin:0;">
        © 2026 MuMu &nbsp;·&nbsp;
        <a href="https://mumu.shop/legal/terms" style="color:#fb923c;">Terms</a>
        &nbsp;·&nbsp;
        <a href="https://mumu.shop/legal/odds" style="color:#fb923c;">Odds</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function withdrawalConfirmationHtml({
  name,
  amount,
  paypalEmail,
}: {
  name: string;
  amount: number;
  paypalEmail: string;
}) {
  return shell(`
    <h1 style="font-size:28px;font-weight:900;color:#431407;margin:0 0 8px;">
      Withdrawal received ✓
    </h1>
    <p style="font-size:15px;color:#c2410c;margin:0 0 32px;">
      Hi ${name}, we've got your request.
    </p>

    <div style="background:#fff7ed;border-radius:16px;padding:24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:42px;font-weight:900;color:#431407;line-height:1;">
        $${amount.toFixed(2)}
      </div>
      <div style="font-size:13px;color:#ea580c;margin-top:6px;font-weight:600;">
        to ${paypalEmail}
      </div>
    </div>

    <p style="font-size:14px;color:#9a3412;margin:0 0 16px;line-height:1.6;">
      Your withdrawal has been deducted from your balance and is being reviewed.
      Payments are sent within <strong>2–3 business days</strong> via PayPal.
    </p>

    <p style="font-size:14px;color:#9a3412;margin:0 0 32px;line-height:1.6;">
      You'll receive a PayPal notification once the payment clears. If you have
      questions, reply to this email or contact
      <a href="mailto:support@mumu.shop" style="color:#ea580c;">support@mumu.shop</a>.
    </p>

    <div style="text-align:center;">
      <a href="https://mumu.shop/profile"
        style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;font-size:14px;
               padding:14px 36px;border-radius:14px;text-decoration:none;">
        View your profile
      </a>
    </div>
  `);
}

function nudgeHtml({ name, amount }: { name: string; amount: number }) {
  return shell(`
    <h1 style="font-size:28px;font-weight:900;color:#431407;margin:0 0 8px;">
      The box is calling, ${name} 📦
    </h1>
    <p style="font-size:15px;color:#c2410c;margin:0 0 28px;">
      You pulled $${amount.toFixed(2)} out three days ago — nice move.
      But there are still Skullpandas and Labubus in the vault with your name on them.
    </p>

    <div style="background:#fff7ed;border-radius:16px;padding:24px;margin-bottom:28px;">
      <p style="font-size:13px;font-weight:800;color:#7c2d12;text-transform:uppercase;
                letter-spacing:0.05em;margin:0 0 12px;">What's still in the box</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:13px;color:#9a3412;">
          🟣 &nbsp;<strong>Ultra-rare (0.5%):</strong> The Other One Hirono · $200 resale value
        </div>
        <div style="font-size:13px;color:#9a3412;">
          🟠 &nbsp;<strong>Rare (4%):</strong> Skullpanda Emotion Series · $60 buyback
        </div>
        <div style="font-size:13px;color:#9a3412;">
          🔵 &nbsp;<strong>Uncommon (25%):</strong> Labubu, Dimoo, Kuromi variants · $25 buyback
        </div>
      </div>
    </div>

    <p style="font-size:14px;color:#9a3412;margin:0 0 32px;line-height:1.6;">
      Each box is <strong>$25</strong>. One pull could pay for itself — and then some.
      Your account is ready whenever you are.
    </p>

    <div style="text-align:center;">
      <a href="https://mumu.shop/box"
        style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;font-size:14px;
               padding:14px 36px;border-radius:14px;text-decoration:none;">
        Open a box — $25
      </a>
    </div>

    <p style="font-size:12px;color:#fed7aa;text-align:center;margin-top:20px;">
      Odds: Common 70.5% · Uncommon 25% · Rare 4% · Ultra 0.5%
    </p>
  `);
}

function winBackHtml({ name }: { name: string }) {
  return shell(`
    <h1 style="font-size:28px;font-weight:900;color:#431407;margin:0 0 8px;">
      The vault is still open, ${name} 🎁
    </h1>
    <p style="font-size:15px;color:#c2410c;margin:0 0 28px;">
      It's been two weeks since you last opened a box. A lot has changed —
      and a lot hasn't. The rarest pulls are still in there waiting.
    </p>

    <div style="background:linear-gradient(135deg,#431407 0%,#7c2d12 100%);
                border-radius:20px;padding:32px;margin-bottom:28px;">
      <p style="font-size:12px;font-weight:800;color:#fed7aa;text-transform:uppercase;
                letter-spacing:0.1em;margin:0 0 16px;">Still in inventory</p>
      <div style="font-size:14px;color:#fff;line-height:2;">
        🟣 The Other One Hirono — <strong>Ultra-rare</strong> · $200 resale value<br/>
        🟣 The Warmth Skullpanda — <strong>Ultra-rare</strong> · $200 resale value<br/>
        🟠 Skullpanda Emotion Series — <strong>Rare</strong> · $50 buyback<br/>
        🔵 Labubu, Dimoo &amp; Sanrio variants — <strong>Uncommon</strong>
      </div>
    </div>

    <p style="font-size:14px;color:#9a3412;margin:0 0 16px;line-height:1.6;">
      Every box is <strong>$25</strong>. Every pull is independent. One spin is all it takes.
      The 0.5% ultra-rare odds don't care how long it's been — they reset every single box.
    </p>

    <p style="font-size:14px;color:#9a3412;margin:0 0 32px;line-height:1.6;">
      Your account is right where you left it. Come back whenever you're ready.
    </p>

    <div style="text-align:center;">
      <a href="https://mumu.shop/box"
        style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;font-size:14px;
               padding:14px 36px;border-radius:14px;text-decoration:none;">
        Open a box — $25
      </a>
    </div>

    <p style="font-size:12px;color:#fed7aa;text-align:center;margin-top:20px;">
      Odds: Common 70.5% · Uncommon 25% · Rare 4% · Ultra 0.5%
    </p>
  `);
}
