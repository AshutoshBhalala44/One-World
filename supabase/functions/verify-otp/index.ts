import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!sid || !token || !verifySid) {
      return new Response(
        JSON.stringify({ error: "SMS service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check the code with Twilio Verify
    const checkUrl = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    const auth = btoa(`${sid}:${token}`);

    const checkRes = await fetch(checkUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok || checkData.status !== "approved") {
      console.error("Verify check failed:", checkRes.status, checkData);
      return new Response(
        JSON.stringify({ error: "Incorrect or expired verification code. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user with this phone exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", phone)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      const fakeEmail = `${phone.replace("+", "")}@phone.oneworld.app`;
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        phone: phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone },
      });

      if (createError || !newUser.user) {
        console.error("Failed to create user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;

      await supabase.from("profiles").insert({ user_id: userId, phone });
    }

    // Generate magic link to sign the user in
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${phone.replace("+", "")}@phone.oneworld.app`,
      });

    if (sessionError || !sessionData) {
      console.error("Session generation error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        userId,
        actionLink: sessionData.properties?.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
