import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Phone, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CountryCodePicker, defaultCountry, type Country } from "@/components/CountryCodePicker";

type Step = "phone" | "otp";

const Auth = () => {
  const [step, setStep] = useState<Step>("phone");
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [localPhone, setLocalPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = `${country.dial}${localPhone.replace(/\D/g, "")}`;

  const handleSendOtp = async () => {
    if (localPhone.replace(/\D/g, "").length < 4) {
      toast.error("Enter a valid phone number");
      return;
    }
    const phone = fullPhone;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Auto-fill OTP code (no SMS verification required)
      if (data?.code) {
        const digits = data.code.split("");
        setOtp(digits);
      }

      toast.success("Verification code ready!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: fullPhone, code },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Use the action link to sign in
      if (data?.actionLink) {
        // Extract token from action link and verify
        const url = new URL(data.actionLink);
        const token_hash = url.searchParams.get("token") || url.hash;
        
        // Sign in with the magic link token
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: url.searchParams.get("token") || "",
          type: "magiclink",
        });

        if (signInError) {
          // Fallback: try setting session via the link
          window.location.href = data.actionLink;
          return;
        }
      }

      toast.success(data?.isNewUser ? "Account created!" : "Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.every((d) => d)) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground tracking-tight">
            One World
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-accent" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                    Welcome
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your phone number to sign in or create an account.
                    We'll send you a verification code.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Phone Number
                    </label>
                    <div className="flex">
                      <CountryCodePicker selected={country} onSelect={setCountry} />
                      <Input
                        type="tel"
                        placeholder="234 567 8900"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        className="text-lg h-12 rounded-l-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || localPhone.replace(/\D/g, "").length < 4}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-7 h-7 text-success" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    Verify Your Number
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-foreground">{fullPhone}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.some((d) => !d)}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify & Sign In
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => {
                        setStep("phone");
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change number
                    </button>
                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-accent hover:text-accent/80 font-medium transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to participate in transparent, unmanipulated polling.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
