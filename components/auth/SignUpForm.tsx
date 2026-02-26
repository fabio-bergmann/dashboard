"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeInput from "@/components/CodeInput";
import AuthInputField from "@/components/auth/AuthInputField";
import MailIcon from "@/components/icons/MailIcon";
import LockIcon from "@/components/icons/LockIcon";

export default function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const submittingRef = React.useRef(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signUp!.create({ emailAddress: email, password });
      await signUp!.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setVerifying(true);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitVerification(codeToVerify: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setIsLoading(true);
    try {
      const attempt = await signUp!.attemptEmailAddressVerification({
        code: codeToVerify,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await activateSession(attempt.createdSessionId);
      } else if (attempt.status === "complete") {
        setError(
          "Sign-up succeeded, but session activation failed. Please sign in."
        );
      } else {
        setError(
          "Additional information is required to complete sign-up. Please retry."
        );
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Invalid code.");
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleCodeComplete(completedCode: string) {
    submitVerification(completedCode);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    await submitVerification(code);
  }

  if (verifying) {
    return (
      <>
        <h1 className="text-[22px] font-semibold text-foreground mb-1">
          Check your email
        </h1>
        <p className="text-[15px] text-muted mb-8">
          We sent a verification code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-foreground">
              Verification code
            </label>
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={handleCodeComplete}
            />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[22px] font-semibold text-foreground mb-1">
        Sign up for a new account
      </h1>
      <p className="text-[15px] text-muted mb-8">
        Already a member?{" "}
        <Link href="/sign-in" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInputField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          icon={<MailIcon className="h-5 w-5 shrink-0 text-muted" />}
        />

        <AuthInputField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          icon={<LockIcon className="h-5 w-5 shrink-0 text-muted" />}
        />

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <div id="clerk-captcha" />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing up..." : "Sign up"}
        </button>
      </form>
    </>
  );
}
