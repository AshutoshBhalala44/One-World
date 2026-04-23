import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWILIO_GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const phoneRegex = /^\+[1-9]\d{1,14}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use E.164 format (e.g., +1234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      console.error("Twilio gateway credentials are not configured");
      return new Response(
        JSON.stringify({ error: "SMS service is not configured", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!TWILIO_PHONE_NUMBER || !phoneRegex.test(TWILIO_PHONE_NUMBER)) {
      console.error("TWILIO_PHONE_NUMBER is invalid or missing", TWILIO_PHONE_NUMBER);
      return new Response(
        JSON.stringify({
          error: "SMS sender number is invalid. Set TWILIO_PHONE_NUMBER in E.164 format, for example +15551234567.",
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.rpc("cleanup_expired_otps");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashedCode = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone", phone)
      .eq("verified", false);

    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({ phone, code: hashedCode, expires_at: expiresAt });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioResponse = await fetch(`${TWILIO_GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: TWILIO_PHONE_NUMBER,
        Body: `Your One World verification code is ${code}. It expires in 5 minutes.`,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio send failed:", twilioResponse.status, twilioData);

      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", phone)
        .eq("verified", false);

      const twilioMessage = typeof twilioData?.message === "string" ? twilioData.message : null;
      const errorMessage =
        twilioResponse.status === 400 && twilioMessage
          ? `Twilio rejected the SMS: ${twilioMessage}`
          : "Failed to send verification code. Please try again.";

      return new Response(
        JSON.stringify({ error: errorMessage, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ${phone} (Twilio SID: ${twilioData.sid})`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send verification code. Please try again.", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
