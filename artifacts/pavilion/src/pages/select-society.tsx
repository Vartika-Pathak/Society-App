import React from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { PavilionMark } from "@/components/pavilion-mark";

// Standing in for a "choose your society" step, the way a multi-society platform would
// have you pick which one you belong to before signing in. There's only one society here,
// but the flow is the same — select it, then land on the login page.
export default function SelectSociety() {
  const [, navigate] = useLocation();

  return (
    <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-serif font-medium text-foreground mb-2">Select your society</h1>
          <p className="text-muted-foreground">Choose your community to continue.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full flex items-center gap-4 rounded-2xl border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PavilionMark className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-lg font-medium text-foreground">Pavilion</p>
            <p className="text-sm text-muted-foreground">Community, elevated</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
