"use client";

import React, { useEffect, useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeInput from "@/components/CodeInput";
import AuthInputField from "@/components/auth/AuthInputField";
import MailIcon from "@/components/icons/MailIcon";
import LockIcon from "@/components/icons/LockIcon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (isSignedIn) router.push("/");
  }, [isSignedIn, router]);

  if (!isLoaded) return null;

  async function activateSession(sessionId: string) {
    await setActive!({
      session: sessionId,
      navigate: async ({ session }) => {
        if (session?.currentTask?.key === "reset-password") {
          router.push("/forgot-password");
          return;
        }
        if (session?.currentTask) {
          router.push("/sign-in");
          return;
        }
        router.push("/");
      },
    });
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("reset");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(result.createdSessionId);
      } else if (result.status === "complete") {
        setError(
          "Password reset succeeded, but session activation failed. Please sign in."
        );
      } else if (result.status === "needs_second_factor") {
        setError(
          "Your account needs a second factor. Please continue on the sign-in page."
        );
      } else {
        setError("Password reset was not completed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {step === "email" ? (
        <>
          <h1 className="text-[22px] font-semibold text-foreground mb-1">
            Reset your password
          </h1>
          <p className="text-[15px] text-muted mb-8">
            Enter your email and we&apos;ll send you a reset code.
          </p>

          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <AuthInputField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              icon={<MailIcon className="h-5 w-5 shrink-0 text-muted" />}
            />

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-[22px] font-semibold text-foreground mb-1">
            Check your email
          </h1>
          <p className="text-[15px] text-muted mb-8">
            We sent a reset code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>

          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-foreground">
                Reset code
              </label>
              <CodeInput value={code} onChange={setCode} />
            </div>

            <AuthInputField
              id="password"
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              icon={<LockIcon className="h-5 w-5 shrink-0 text-muted" />}
            />

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/sign-in"
          className="text-[13px] text-muted hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </>
  );
}
