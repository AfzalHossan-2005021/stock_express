'use client'

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/better-auth/auth-client";
import { toast } from "sonner";
import { Github, Chrome } from "lucide-react";

type ProviderId = "google" | "github";

const providerLabels: Record<ProviderId, string> = {
  google: "Google",
  github: "GitHub",
};

export default function SocialAuthButtons() {
  const onSocialSignIn = async (provider: ProviderId) => {
    try {
      const { error } = await authClient.signIn.social({ provider });
      if (error) {
        toast.error("Social sign-in failed", {
          description: error.message || "Please try again.",
        });
      }
    } catch (err) {
      toast.error("Social sign-in failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="pt-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-800/30 px-3 text-xs text-gray-400">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => onSocialSignIn("google")}
          className="h-12 rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg flex items-center justify-center gap-2"
        >
          <Chrome className="h-4 w-4" />
          <span className="hidden sm:inline">{providerLabels.google}</span>
        </Button>
        <Button
          type="button"
          onClick={() => onSocialSignIn("github")}
          className="h-12 rounded-lg bg-gradient-to-b from-purple-500/90 to-purple-500/60 hover:from-purple-500 hover:to-purple-500/70 text-white font-medium shadow-lg flex items-center justify-center gap-2"
        >
          <Github className="h-4 w-4" />
          <span className="hidden sm:inline">{providerLabels.github}</span>
        </Button>
      </div>
    </div>
  );
}
