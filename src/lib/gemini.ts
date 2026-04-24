import { supabase } from './supabase';

export async function generateFeasibilityReport(abstract: string): Promise<string> {
  if (!abstract) return "No abstract provided.";
  
  try {
    // We now securely invoke the Supabase Edge Function instead of 
    // making the API call directly from the frontend browser.
    const { data, error } = await supabase.functions.invoke('gemini-feasibility', {
      body: { abstract }
    });

    if (error) {
      console.error("Supabase edge function execution failed:", error);
      throw error;
    }
    
    return data.report || "Could not generate report.";
  } catch (error) {
    console.error("Edge Function Invocation Error:", error);
    return "Error generating AI report. Please check API configuration or edge function logs.";
  }
}
