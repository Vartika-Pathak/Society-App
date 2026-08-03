import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type ReCAPTCHA from "react-google-recaptcha";
import { Mail, Lock, Eye, EyeOff, User, Hash, ShieldCheck } from "lucide-react";
import { getGetCurrentUserQueryKey, type AuthUser } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { Captcha } from "@/components/captcha";
import { PavilionMark } from "@/components/pavilion-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiPost, ApiFetchError } from "@/lib/api-fetch";

// Some backends (Java) stage the account and require the emailed OTP to be
// entered before it's actually created; others (Node) create it immediately.
// Branching on the response shape lets the same page work against either.
type SignupResult = AuthUser | { pendingSignupId: number; email: string };

function isPending(result: SignupResult): result is { pendingSignupId: number; email: string } {
  return "pendingSignupId" in result;
}

export default function Signup() {
  const [form, setForm] = useState({ name: "", flatNumber: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [pending, setPending] = useState<{ pendingSignupId: number; email: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Navigate only once useAuth's own query has actually picked up the new
  // session — navigating straight from a successful mutation races
  // React Query's (microtask-batched) cache notification against wouter's
  // (synchronous) route change, so the dashboard's auth guard can mount
  // and redirect away before the cache update ever reaches it.
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await apiPost<SignupResult>("/api/auth/signup", {
        ...form,
        captchaToken: captchaToken ?? "",
      });
      if (isPending(result)) {
        setPending(result);
      } else {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), result);
        toast({ title: "Account created!", description: "Welcome to the Pavilion community." });
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof ApiFetchError ? error.message : "There was a problem creating your account. Please try again.",
        variant: "destructive",
      });
      // A CAPTCHA token is single-use — reset the widget so the resident
      // can try again (e.g. after a duplicate-email error) without a stale token.
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setIsVerifying(true);
    setOtpError(null);
    try {
      const user = await apiPost<AuthUser>("/api/auth/signup/verify", {
        pendingSignupId: pending.pendingSignupId,
        otpCode,
      });
      queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
      toast({ title: "Account created!", description: "Welcome to the Pavilion community." });
    } catch (error) {
      setOtpError(error instanceof ApiFetchError ? error.message : "Couldn't verify that code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (pending) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-medium">Verify your email</h1>
            <p className="text-muted-foreground text-sm">
              We sent a 6-digit code to <span className="font-medium text-foreground">{pending.email}</span>. Enter it
              below to finish creating your account.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otpCode">Verification code</Label>
              <Input
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                pattern="[0-9]{6}"
                title="Enter the 6-digit code"
                autoFocus
                required
              />
              {otpError && <p className="text-sm text-destructive">{otpError}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={isVerifying}>
              {isVerifying ? "Verifying…" : "Verify & create account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setPending(null);
                setOtpCode("");
                setOtpError(null);
              }}
            >
              Use a different email
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-80px)]">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80"
          alt="Community"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <PavilionMark className="h-6 w-6" />
            </div>
            <span className="font-serif text-2xl font-semibold">Pavilion</span>
          </div>
          <div>
            <blockquote className="text-4xl font-serif font-light leading-snug mb-6">
              "Your community is waiting for you."
            </blockquote>
            <ul className="space-y-3 text-primary-foreground/80">
              {[
                "Access the full events calendar",
                "Stay up to date with community news",
                "Connect with your neighbours",
                "Share photos in the gallery",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-serif font-medium text-foreground mb-2">Create account</h1>
            <p className="text-muted-foreground">Join the Pavilion community today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={handleChange}
                    className="pl-9"
                    pattern="[A-Za-z ]{2,100}"
                    title="Letters and spaces only"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flatNumber">Flat number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="flatNumber"
                    name="flatNumber"
                    placeholder="e.g. A101"
                    value={form.flatNumber}
                    onChange={handleChange}
                    className="pl-9"
                    pattern="[A-Za-z][0-9]{1,3}"
                    title="A letter followed by 1-3 digits, e.g. A101"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-9 pr-9"
                  minLength={8}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              By signing up you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>

            <Captcha ref={captchaRef} onChange={setCaptchaToken} />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full"
              disabled={isSubmitting || !captchaToken}
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
