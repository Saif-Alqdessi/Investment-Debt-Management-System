// supabase/functions/check-maturity-dates/index.ts

import { serve } from "[deno.land](https://deno.land/std@0.177.0/http/server.ts)";
import { createClient } from "[esm.sh](https://esm.sh/@supabase/supabase-js@2)";
import { Resend } from "[esm.sh](https://esm.sh/resend@2.0.0)";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch pending notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      *,
      investment:investments(investor_name, principal_amount, due_date, profit_amount, total_payout)
    `)
    .lte("scheduled_date", new Date().toISOString().split("T")[0])
    .eq("is_sent", false)
    .lt("retry_count", 3);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const results = [];

  for (const notif of notifications || []) {
    try {
      // Build beautiful HTML email
      const html = buildEmailTemplate(notif);

      // Send via Resend
      await resend.emails.send({
        from: "Portfolio Tracker <alerts@yourdomain.com>",
        to: notif.recipient_email,
        subject: notif.subject,
        html: html,
      });

      // Mark as sent
      await supabase
        .from("notifications")
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq("id", notif.id);

      results.push({ id: notif.id, status: "sent" });
    } catch (err) {
      // Increment retry count
      await supabase
        .from("notifications")
        .update({
          retry_count: notif.retry_count + 1,
          error_message: err.message,
        })
        .eq("id", notif.id);

      results.push({ id: notif.id, status: "failed", error: err.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});

function buildEmailTemplate(notif: any): string {
  const inv = notif.investment;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">📊 Investment Alert</h1>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
        <h2 style="color: #1a1a2e;">${notif.subject}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Investor</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${inv?.investor_name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Principal</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">$${inv?.principal_amount?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Profit</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #28a745;">+$${inv?.profit_amount?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Total Payout</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold;">$${inv?.total_payout?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Due Date</strong></td>
            <td style="padding: 10px;">${inv?.due_date}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 4px;">
          <a href="[yourapp.com](https://yourapp.com/investments/${notif.entity_id})" 
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Investment Details →
          </a>
        </div>
      </div>
    </div>
  `;
}
