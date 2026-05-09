// @ts-expect-error: Deno URL imports are not supported by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error: npm imports are specific to Deno
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, studentName, guideName, projectName } = await req.json()

    if (!email || !studentName || !guideName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // @ts-expect-error: Deno global is not recognized by standard TS
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const resend = new Resend(resendApiKey);

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2563eb;">AcademiSync Pro: Guide Allocated</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Great news! The administrator has successfully allocated a project guide for your team.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Project:</strong> ${projectName || 'Your Team Project'}</p>
          <p style="margin: 5px 0 0 0;"><strong>Allocated Guide:</strong> ${guideName}</p>
        </div>
        <p>Please log in to your dashboard to view the details and begin submitting your project milestones.</p>
        <br/>
        <a href="https://academisync.pro/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        <br/><br/>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This is an automated message from the AcademiSync System. Please do not reply.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'AcademiSync <notifications@academisync.pro>', // You will need to verify a domain in Resend, or use "onboarding@resend.dev" for testing.
      to: [email],
      subject: 'Your Project Guide has been Allocated',
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error("Edge function execution error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
