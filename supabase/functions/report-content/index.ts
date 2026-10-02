import { withSupabase } from 'npm:@supabase/server@1';
import {
  buildReportEmailText,
  parseReportInput,
  type ReportInput,
} from './report.ts';

const destination = 'contato@setlistbr.app.br';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

const authenticatedHandler = withSupabase(
  { auth: 'user' },
  async (request, ctx) => {
    if (request.method !== 'POST')
      return respond({ error: 'METHOD_NOT_ALLOWED' }, 405);

    let input: ReportInput | null;
    try {
      input = parseReportInput(await request.json());
    } catch {
      input = null;
    }
    if (!input) return respond({ error: 'INVALID_REPORT' }, 400);

    const reporterId = ctx.userClaims?.id;
    if (
      !reporterId ||
      (input.kind === 'user' && input.targetId === reporterId)
    ) {
      return respond({ error: 'INVALID_REPORT' }, 400);
    }

    const { data: membership, error: membershipError } = await ctx.supabase
      .from('band_members')
      .select('user_id')
      .eq('band_id', input.bandId)
      .eq('user_id', reporterId)
      .maybeSingle();
    if (membershipError || !membership) {
      return respond({ error: 'REPORT_NOT_ALLOWED' }, 403);
    }

    const targetQuery =
      input.kind === 'song'
        ? ctx.supabase.from('songs').select('id').eq('band_id', input.bandId)
        : ctx.supabase
            .from('band_members')
            .select('user_id')
            .eq('band_id', input.bandId);
    const { data: target, error: targetError } = await targetQuery
      .eq(input.kind === 'song' ? 'id' : 'user_id', input.targetId)
      .maybeSingle();
    if (targetError || !target) {
      return respond({ error: 'REPORT_NOT_ALLOWED' }, 403);
    }

    const apiKey = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL');
    if (!apiKey || !senderEmail) {
      return respond({ error: 'DELIVERY_UNAVAILABLE' }, 503);
    }

    const { data: ticket, error: throttleError } =
      await ctx.supabase.rpc('claim_report_slot');
    if (throttleError) return respond({ error: 'DELIVERY_UNAVAILABLE' }, 503);
    if (!ticket) return respond({ error: 'RATE_LIMITED' }, 429);

    const message = buildReportEmailText(input, ticket, reporterId);

    try {
      const delivery = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: 'Setlist' },
          to: [{ email: destination }],
          subject: `[Setlist] Denúncia ${ticket}`,
          textContent: message,
        }),
      });
      if (!delivery.ok) throw new Error('BREVO_REJECTED');
      // HTTP 2xx confirma o aceite pelo provedor. Falha ao ler o corpo não deve
      // transformar um envio aceito em erro com risco de denúncia duplicada.
      return respond({ accepted: true, caseId: ticket }, 200);
    } catch {
      await ctx.supabaseAdmin.rpc('release_report_slot', { p_ticket: ticket });
      return respond({ error: 'DELIVERY_UNAVAILABLE' }, 503);
    }
  },
);

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { headers: corsHeaders });
    const response = await authenticatedHandler(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders))
      headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  },
};
