import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DonationRequest {
  amountInCents: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
}

function validate(body: any): DonationRequest {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");

  const amountInCents = Number(body.amountInCents);
  if (!Number.isInteger(amountInCents) || amountInCents < 100 || amountInCents > 10_000_00) {
    throw new Error("Amount must be a whole number of cents between 100 and 1,000,000");
  }
  if (typeof body.returnUrl !== "string" || !body.returnUrl.startsWith("http")) {
    throw new Error("Invalid returnUrl");
  }
  if (body.environment !== "sandbox" && body.environment !== "live") {
    throw new Error("Invalid environment");
  }
  if (body.customerEmail !== undefined) {
    if (typeof body.customerEmail !== "string" || body.customerEmail.length > 320 || !body.customerEmail.includes("@")) {
      throw new Error("Invalid customerEmail");
    }
  }
  if (body.userId !== undefined) {
    if (typeof body.userId !== "string" || !/^[a-zA-Z0-9-]+$/.test(body.userId) || body.userId.length > 64) {
      throw new Error("Invalid userId");
    }
  }
  return {
    amountInCents,
    customerEmail: body.customerEmail,
    userId: body.userId,
    returnUrl: body.returnUrl,
    environment: body.environment,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json().catch(() => null);
    const opts = validate(raw);
    const stripe = createStripeClient(opts.environment);

    const amountDisplay = (opts.amountInCents / 100).toFixed(2);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "One World Donation",
              description: "Support transparent global polling — every voice heard, free and unfiltered.",
            },
            unit_amount: opts.amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      return_url: opts.returnUrl,
      payment_intent_data: {
        description: `One World donation — $${amountDisplay}`,
        metadata: {
          ...(opts.userId && { userId: opts.userId }),
          donation: "true",
        },
      },
      metadata: {
        ...(opts.userId && { userId: opts.userId }),
        donation: "true",
        amount_cents: String(opts.amountInCents),
      },
      ...(opts.customerEmail && { customer_email: opts.customerEmail }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-donation-checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
