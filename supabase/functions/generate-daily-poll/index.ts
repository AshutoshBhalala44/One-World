import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in CST (UTC-6)
    const now = new Date();
    const cstOffset = -6 * 60;
    const cstDate = new Date(now.getTime() + cstOffset * 60 * 1000);
    const todayCST = cstDate.toISOString().split("T")[0];

    // Check if a poll already exists for today
    const { data: existingPoll } = await supabase
      .from("polls")
      .select("id")
      .eq("active_date", todayCST)
      .maybeSingle();

    if (existingPoll) {
      return new Response(
        JSON.stringify({ message: "Poll already exists for today", date: todayCST }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch recent polls to avoid repetition
    const { data: recentPolls } = await supabase
      .from("polls")
      .select("question, category")
      .order("active_date", { ascending: false })
      .limit(14);

    const recentQuestions = (recentPolls || [])
      .map((p) => `- [${p.category}] ${p.question}`)
      .join("\n");

    // Call Lovable AI to generate a poll
    const systemPrompt = `You are a poll question generator for a global opinion platform called "One World". 
Your job is to create ONE thought-provoking, timely poll question about current societal issues, trends, or debates.

Rules:
- The question should be relevant to what people around the world are currently discussing or facing.
- Topics can include: technology, politics, environment, social issues, economy, health, culture, AI, education, human rights.
- The question must be neutral and not leading — it should genuinely invite diverse opinions.
- Provide exactly 4 answer options that cover a reasonable spectrum of viewpoints.
- Keep the question concise (under 120 characters ideally).
- Vary the category. Don't repeat recent topics.

Categories to choose from: general, technology, politics, environment, society, economy, health, culture, science, education`;

    const userPrompt = `Today's date is ${todayCST}.

Here are the most recent polls (avoid similar topics):
${recentQuestions || "No recent polls yet."}

Generate a new daily poll question with 4 options. The question should be about a current societal issue or trending topic that people care about right now.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_poll",
                description: "Create a daily poll with a question and 4 options",
                parameters: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The poll question (under 120 chars)",
                    },
                    category: {
                      type: "string",
                      enum: [
                        "general",
                        "technology",
                        "politics",
                        "environment",
                        "society",
                        "economy",
                        "health",
                        "culture",
                        "science",
                        "education",
                      ],
                    },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                      description: "Exactly 4 answer options",
                    },
                  },
                  required: ["question", "category", "options"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_poll" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return a tool call response");
    }

    const pollData = JSON.parse(toolCall.function.arguments);
    const { question, category, options } = pollData;

    if (!question || !category || !options || options.length !== 4) {
      throw new Error("Invalid poll data from AI: " + JSON.stringify(pollData));
    }

    // Insert the poll as auto-approved but flagged for review
    const { data: newPoll, error: pollError } = await supabase
      .from("polls")
      .insert({ question, category, active_date: todayCST, status: 'approved', needs_review: true })
      .select("id")
      .single();

    if (pollError) throw new Error("Failed to insert poll: " + pollError.message);

    // Insert options
    const optionRows = options.map((label: string, idx: number) => ({
      poll_id: newPoll.id,
      label,
      sort_order: idx,
    }));

    const { error: optError } = await supabase
      .from("poll_options")
      .insert(optionRows);

    if (optError) throw new Error("Failed to insert options: " + optError.message);

    console.log(`Generated poll for ${todayCST}: "${question}" [${category}]`);

    return new Response(
      JSON.stringify({
        success: true,
        date: todayCST,
        question,
        category,
        options,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-daily-poll error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
