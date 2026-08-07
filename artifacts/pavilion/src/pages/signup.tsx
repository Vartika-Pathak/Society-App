import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type ReCAPTCHA from "react-google-recaptcha";
import { Mail, Lock, Eye, EyeOff, User, Hash, ShieldCheck, Users, Plus, Trash2 } from "lucide-react";
import { getGetCurrentUserQueryKey, type AuthUser } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { Captcha } from "@/components/captcha";
import { PavilionMark } from "@/components/pavilion-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiGet, ApiFetchError } from "@/lib/api-fetch";

// Matches the polling interval already used for emergency alerts on the dashboard.
const VERIFICATION_POLL_INTERVAL_MS = 5000;

// Some backends (Java) stage the account and require the emailed OTP to be
// entered before it's actually created; others (Node) create it immediately.
// Branching on the response shape lets the same page work against either.
type SignupResult = AuthUser | { pendingSignupId: number; email: string };

function isPending(result: SignupResult): result is { pendingSignupId: number; email: string } {
  return "pendingSignupId" in result;
}

interface FamilyMemberForm {
  name: string;
  relation: string;
  age: string;
}

const emptyFamilyMember: FamilyMemberForm = { name: "", relation: "", age: "" };

// Formats as it's typed, e.g. "a100" -> "A-100", so the hyphenated flat number
// format is always what ends up entered without anyone typing the hyphen by hand.
function formatFlatNumber(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letter = cleaned.slice(0, 1);
  const digits = cleaned.slice(1, 4);
  return letter + (digits ? `-${digits}` : "");
}

export default function Signup() {
  // "verify" is where a first-time resident submits their name + flat for an admin to review;
  // "pending_review" polls for that admin's decision; "form" is the actual account-creation
  // step (only reachable once approved); "family" is a second, conditional page for family
  // member details, only shown when the resident says they have family with them.
  const [step, setStep] = useState<"verify" | "pending_review" | "form" | "family">("verify");

  const [verifyForm, setVerifyForm] = useState({ flatNumber: "", name: "" });
  const [isVerifyingResident, setIsVerifyingResident] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "rejected">("pending");

  const [form, setForm] = useState({ name: "", flatNumber: "", email: "", password: "" });
  const [hasFamily, setHasFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([{ ...emptyFamilyMember }]);

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

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingResident(true);
    setVerifyError(null);
    try {
      const result = await apiPost<{ status: string; message: string }>(
        "/api/auth/verification-requests",
        verifyForm
      );
      if (result.status === "approved") {
        setForm((f) => ({ ...f, name: verifyForm.name, flatNumber: verifyForm.flatNumber }));
        setStep("form");
      } else if (result.status === "rejected") {
        setReviewStatus("rejected");
        setStep("pending_review");
      } else {
        setReviewStatus("pending");
        setStep("pending_review");
      }
    } catch (error) {
      if (error instanceof ApiFetchError && error.status === 404) {
        // This backend doesn't have resident verification at all (the Node API) —
        // skip straight to the signup form instead of blocking everyone out.
        setForm((f) => ({ ...f, name: verifyForm.name, flatNumber: verifyForm.flatNumber }));
        setStep("form");
      } else {
        setVerifyError(
          error instanceof ApiFetchError ? error.message : "Couldn't submit your request. Please try again."
        );
      }
    } finally {
      setIsVerifyingResident(false);
    }
  };

  // While on the "under review" screen, quietly poll for the admin's decision so approval
  // takes effect without the resident having to do anything else.
  useEffect(() => {
    if (step !== "pending_review" || reviewStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({ flatNumber: verifyForm.flatNumber, name: verifyForm.name });
        const result = await apiGet<{ status: string; message: string }>(
          `/api/auth/verification-requests/status?${params.toString()}`
        );
        if (result.status === "approved") {
          setForm((f) => ({ ...f, name: verifyForm.name, flatNumber: verifyForm.flatNumber }));
          setStep("form");
        } else if (result.status === "rejected") {
          setReviewStatus("rejected");
        }
      } catch {
        // Transient poll failure — just try again on the next tick.
      }
    }, VERIFICATION_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [step, reviewStatus, verifyForm.flatNumber, verifyForm.name]);

  const updateFamilyMember = (index: number, field: keyof FamilyMemberForm, value: string) =>
    setFamilyMembers((members) => members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  const addFamilyMember = () => setFamilyMembers((members) => [...members, { ...emptyFamilyMember }]);
  const removeFamilyMember = (index: number) =>
    setFamilyMembers((members) => (members.length > 1 ? members.filter((_, i) => i !== index) : members));

  const submitSignup = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        flatNumber: form.flatNumber,
        password: form.password,
        captchaToken: captchaToken ?? "",
        ...(hasFamily
          ? {
              familyMembers: familyMembers
                .filter((m) => m.name.trim() && m.relation.trim())
                .map((m) => ({
                  name: m.name.trim(),
                  relation: m.relation.trim(),
                  age: m.age ? Number(m.age) : undefined,
                })),
            }
          : {}),
      };
      const result = await apiPost<SignupResult>("/api/auth/signup", payload);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFamily) {
      setStep("family");
    } else {
      void submitSignup();
    }
  };

  const handleFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitSignup();
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
          {step === "verify" && (
            <>
              <div>
                <h1 className="text-3xl font-serif font-medium text-foreground mb-2">Confirm your residency</h1>
                <p className="text-muted-foreground">
                  First time signing up? Enter your flat number and full name so the committee can confirm you're a
                  resident before you create an account.
                </p>
              </div>

              <form onSubmit={handleSubmitVerification} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="verifyFlatNumber">Flat number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="verifyFlatNumber"
                      name="flatNumber"
                      placeholder="e.g. A-100"
                      value={verifyForm.flatNumber}
                      onChange={(e) =>
                        setVerifyForm((f) => ({ ...f, flatNumber: formatFlatNumber(e.target.value) }))
                      }
                      className="pl-9"
                      pattern="[A-Za-z]-[0-9]{1,3}"
                      title="A letter, a hyphen, then 1-3 digits, e.g. A-100"
                      maxLength={5}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifyName">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="verifyName"
                      name="name"
                      placeholder="Jane Smith"
                      value={verifyForm.name}
                      onChange={(e) => setVerifyForm((f) => ({ ...f, name: e.target.value }))}
                      className="pl-9"
                      pattern="[A-Za-z ]{2,100}"
                      title="Letters and spaces only"
                      maxLength={100}
                      required
                    />
                  </div>
                  {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full rounded-full" disabled={isVerifyingResident}>
                  {isVerifyingResident ? "Submitting…" : "Submit for review"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === "pending_review" && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              {reviewStatus === "pending" ? (
                <>
                  <h1 className="text-2xl font-serif font-medium">Your request is under review</h1>
                  <p className="text-muted-foreground text-sm">
                    The committee is checking flat <span className="font-medium text-foreground">{verifyForm.flatNumber}</span> for{" "}
                    <span className="font-medium text-foreground">{verifyForm.name}</span>. This page will move on
                    automatically once it's approved — no need to refresh.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-serif font-medium">Request declined</h1>
                  <p className="text-muted-foreground text-sm">
                    Your request wasn't approved. Please check with the committee if you believe this is a mistake.
                  </p>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("verify");
                  setReviewStatus("pending");
                }}
              >
                Back
              </Button>
            </div>
          )}

          {step === "form" && (
            <>
              <div>
                <h1 className="text-3xl font-serif font-medium text-foreground mb-2">Create account</h1>
                <p className="text-muted-foreground">Join the Pavilion community today.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="name" name="name" value={form.name} className="pl-9 bg-muted/50" readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flatNumber">Flat number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="flatNumber"
                        name="flatNumber"
                        value={form.flatNumber}
                        className="pl-9 bg-muted/50"
                        readOnly
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

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={hasFamily} onCheckedChange={(checked) => setHasFamily(checked === true)} />
                  <Users className="h-4 w-4 text-muted-foreground" />
                  I have family living with me
                </label>

                <p className="text-xs text-muted-foreground">
                  By signing up you agree to our{" "}
                  <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
                </p>

                {!hasFamily && <Captcha ref={captchaRef} onChange={setCaptchaToken} />}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full"
                  disabled={isSubmitting || (!hasFamily && !captchaToken)}
                >
                  {hasFamily ? "Next: family details" : isSubmitting ? "Creating account…" : "Create account"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("verify")}>
                  Back
                </Button>
              </form>
            </>
          )}

          {step === "family" && (
            <>
              <div>
                <h1 className="text-3xl font-serif font-medium text-foreground mb-2">Family details</h1>
                <p className="text-muted-foreground">Add the family members living with you in {form.flatNumber}.</p>
              </div>

              <form onSubmit={handleFamilySubmit} className="space-y-5">
                <div className="space-y-4">
                  {familyMembers.map((member, index) => (
                    <div key={index} className="rounded-xl border p-4 space-y-3 relative">
                      {familyMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(index)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                          aria-label="Remove family member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor={`family-name-${index}`}>Name</Label>
                        <Input
                          id={`family-name-${index}`}
                          placeholder="Full name"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(index, "name", e.target.value)}
                          pattern="[A-Za-z ]{2,100}"
                          title="Letters and spaces only"
                          maxLength={100}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`family-relation-${index}`}>Relation</Label>
                          <Input
                            id={`family-relation-${index}`}
                            placeholder="e.g. Spouse, Child"
                            value={member.relation}
                            onChange={(e) => updateFamilyMember(index, "relation", e.target.value)}
                            pattern="[A-Za-z ]{2,50}"
                            title="Letters and spaces only"
                            maxLength={50}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`family-age-${index}`}>Age</Label>
                          <Input
                            id={`family-age-${index}`}
                            type="number"
                            placeholder="Age"
                            min={0}
                            max={120}
                            value={member.age}
                            onChange={(e) => updateFamilyMember(index, "age", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={addFamilyMember}>
                  <Plus className="mr-2 h-4 w-4" /> Add another family member
                </Button>

                <Captcha ref={captchaRef} onChange={setCaptchaToken} />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full"
                  disabled={isSubmitting || !captchaToken}
                >
                  {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
                  Back
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
