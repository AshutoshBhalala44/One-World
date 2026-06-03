import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.metadata?.donation !== "true") {
    console.log("Ignoring non-donation checkout session:", session.id);
    return;
  }

  const userId = session.metadata?.userId || null;
  const email = session.customer_email || session.customer_details?.email || null;
  const amountCents = session.amount_total ?? Number(session.metadata?.amount_cents ?? 0);
  const currency = (session.currency || "usd").toLowerCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const status = session.payment_status === "paid" ? "succeeded" : (session.payment_status ?? "pending");

  const { error } = await getSupabase().from("donations").upsert(
    {
      user_id: userId,
      email,
      amount_cents: amountCents,
      currency,
      status,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );

  if (error) console.error("Failed to upsert donation:", error);
}

async function handlePaymentIntentSucceeded(pi: any, env: StripeEnv) {
  if (pi.metadata?.donation !== "true") return;
  const { error } = await getSupabase()
    .from("donations")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", pi.id)
    .eq("environment", env);
  if (error) console.error("Failed to mark donation succeeded:", error);
}

async function handlePaymentIntentFailed(pi: any, env: StripeEnv) {
  if (pi.metadata?.donation !== "true") return;
  const { error } = await getSupabase()
    .from("donations")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", pi.id)
    .eq("environment", env);
  if (error) console.error("Failed to mark donation failed:", error);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook missing/invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object, env);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
