import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false } = await req.json();
    console.log('AI Assistant request:', { stream, messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = `You are VISHWA-AI, an advanced AI assistant specializing in space biology and astrobiology research. You have expertise in:

- Microgravity effects on biological systems
- Space medicine and life support systems  
- Astrobiology and extremophiles
- NASA space missions and research
- NCBI biomedical databases and research
- Biological experiments in space environments
- Mars colonization biology challenges
- Radiation effects on living organisms

Provide accurate, scientific responses with a futuristic, space-exploration tone. Always suggest relevant experiments or research when appropriate. Keep responses concise but informative.`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream
    };

    // Add tool calling only for non-streaming requests
    if (!stream) {
      body.tools = [
        {
          type: "function",
          function: {
            name: "suggest_experiments",
            description: "Suggest 3-5 space biology experiments based on user input.",
            parameters: {
              type: "object",
              properties: {
                experiments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      category: { type: "string", enum: ["microgravity", "radiation", "life_support", "astrobiology", "space_medicine"] },
                      difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                      duration: { type: "string" }
                    },
                    required: ["title", "description", "category", "difficulty"],
                    additionalProperties: false
                  }
                }
              },
              required: ["experiments"],
              additionalProperties: false
            }
          }
        }
      ];
    }

    console.log('Calling Lovable AI with model:', body.model, 'stream:', stream);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          type: 'rate_limit'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI usage credits exhausted. Please add more credits to continue.',
          type: 'payment_required'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    // Handle streaming response
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    const data = await response.json();
    console.log('AI response received successfully');

    // Extract the response content
    let responseContent = data.choices[0].message.content;
    let toolCalls = null;

    // Handle tool calls if present
    if (data.choices[0].message.tool_calls) {
      toolCalls = data.choices[0].message.tool_calls;
      console.log('Tool calls received:', toolCalls.length);
    }

    return new Response(JSON.stringify({ 
      response: responseContent,
      tool_calls: toolCalls,
      model_used: body.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      type: 'server_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});