import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type ReCAPTCHA from "react-google-recaptcha";
import { Building2, Mail, Lock, Eye, EyeOff, User, Hash } from "lucide-react";
import { useSignup, getGetCurrentUserQueryKey, type SignupMutationError } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { Captcha } from "@/components/captcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [form, setForm] = useState({ name: "", flatNumber: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Navigate only once useAuth's own query has actually picked up the new
  // session — navigating straight from the mutation's onSuccess races
  // React Query's (microtask-batched) cache notification against wouter's
  // (synchronous) route change, so the dashboard's auth guard can mount
  // and redirect away before the cache update ever reaches it.
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const signup = useSignup({
    mutation: {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        toast({
          title: "Account created!",
          description: "Welcome to the Pavilion community.",
        });
      },
      onError: (error: SignupMutationError) => {
        toast({
          title: "Signup failed",
          description:
            error instanceof Error
              ? error.message
              : "There was a problem creating your account. Please try again.",
          variant: "destructive",
        });
        // A CAPTCHA token is single-use — reset the widget so the resident
        // can try again (e.g. after a duplicate-email error) without a stale token.
        captchaRef.current?.reset();
        setCaptchaToken(null);
      },
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate({ data: { ...form, captchaToken: captchaToken ?? "" } });
  };

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
              <Building2 className="h-6 w-6" />
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
                    placeholder="e.g. 4B"
                    value={form.flatNumber}
                    onChange={handleChange}
                    className="pl-9"
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
              disabled={signup.isPending || !captchaToken}
            >
              {signup.isPending ? "Creating account…" : "Create account"}
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
