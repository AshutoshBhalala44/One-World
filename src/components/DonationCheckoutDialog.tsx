import { useCallback, useMemo, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DonationCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountInCents: number;
  userId?: string;
  customerEmail?: string;
}

export function DonationCheckoutDialog({
  open,
  onOpenChange,
  amountInCents,
  userId,
  customerEmail,
}: DonationCheckoutDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const returnUrl = `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
    const { data, error: invokeError } = await supabase.functions.invoke("create-donation-checkout", {
      body: {
        amountInCents,
        ...(userId && { userId }),
        ...(customerEmail && { customerEmail }),
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (invokeError || !data?.clientSecret) {
      const msg = (data as any)?.error || invokeError?.message || "Failed to start checkout";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret as string;
  }, [amountInCents, userId, customerEmail]);

  // Stable options object — must not change between renders, or Stripe re-mounts and throws.
  const checkoutOptions = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Donate ${(amountInCents / 100).toFixed(2)} to One World
          </DialogTitle>
          <DialogDescription>
            Your contribution keeps every voice heard, free, and unfiltered.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        ) : (
          <div id="donation-checkout" className="min-h-[400px]">
            {open && (
              <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
            {!open && (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
