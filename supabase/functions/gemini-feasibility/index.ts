import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from 'npm:@google/genai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { abstract } = await req.json()

    if (!abstract) {
      return new Response(JSON.stringify({ error: 'Abstract is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Securely retrieve the API key from Supabase Environment Variables
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(JSON.stringify({ error: 'API key not configured in backend' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Initialize the Gemini Client on the server side
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an expert academic evaluator. Analyze the following project abstract and provide a "Project Difficulty & Feasibility" score out of 100.
      Include a brief 2-3 sentence justification covering technical challenges, resource requirements, and overall scope.
      
      Abstract:
      "${abstract}"
      
      Format your response as:
      Score: [X]/100
      Justification: [Your text]
    `;

    // Make the API call securely from the backend
    const response = await ai.models.generateContent({
      model: 'gemini-2.5',
      contents: prompt,
    });

    return new Response(
      JSON.stringify({ report: response.text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Edge function execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
