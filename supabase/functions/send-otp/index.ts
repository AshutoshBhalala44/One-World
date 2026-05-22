import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Per-phone cooldown window in seconds
const COOLDOWN_SECONDS = 60;
// Max OTP requests per phone per hour
const MAX_PER_HOUR = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || !/^\+[1-9]\d{1,14}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone. Use E.164 format (e.g., +1234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!sid || !token || !verifySid) {
      console.error("Twilio Verify not configured");
      return new Response(
        JSON.stringify({ error: "SMS service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Per-phone rate limiting using otp_codes table as a log
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const cooldownAgo = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();

      const { data: recent } = await admin
        .from("otp_codes")
        .select("created_at")
        .eq("phone", phone)
        .gte("created_at", oneHourAgo)
        .order("created_at", { ascending: false });

      if (recent && recent.length > 0) {
        if (recent[0].created_at > cooldownAgo) {
          return new Response(
            JSON.stringify({ error: `Please wait ${COOLDOWN_SECONDS} seconds before requesting another code.` }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (recent.length >= MAX_PER_HOUR) {
          return new Response(
            JSON.stringify({ error: "Too many verification attempts. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Record this send attempt (code column unused with Twilio Verify, store placeholder)
      await admin.from("otp_codes").insert({
        phone,
        code: "twilio-verify",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    }


    const url = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    const auth = btoa(`${sid}:${token}`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Channel: "sms" }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Twilio Verify start failed:", res.status, errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send verification code" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verify started for ${phone}`);
    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
