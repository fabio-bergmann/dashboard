"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeInput from "@/components/CodeInput";
import AuthInputField from "@/components/auth/AuthInputField";
import MailIcon from "@/components/icons/MailIcon";
import LockIcon from "@/components/icons/LockIcon";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const submittingVerificationRef = React.useRef(false);

  const notReady = !isLoaded;

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
      const attempt = await signIn!.create({ identifier: email, password });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await activateSession(attempt.createdSessionId);
      } else if (attempt.status === "complete") {
        setError(
          "Sign-in succeeded, but session activation failed. Please retry."
        );
      } else if (attempt.status === "needs_second_factor") {
        const emailFactor = attempt.supportedSecondFactors?.find(
          (f) => f.strategy === "email_code"
        ) as { strategy: "email_code"; emailAddressId: string } | undefined;

        if (emailFactor) {
          await signIn!.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setShowCode(true);
        } else {
          setError(
            "This account requires an unsupported second factor. Please contact support."
          );
        }
      } else {
        setError("Additional sign-in steps are required. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitVerification(codeToVerify: string) {
    if (submittingVerificationRef.current) return;
    submittingVerificationRef.current = true;
    setError("");
    setIsLoading(true);
    try {
      const attempt = await signIn!.attemptSecondFactor({
        strategy: "email_code",
        code: codeToVerify,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await activateSession(attempt.createdSessionId);
      } else if (attempt.status === "complete") {
        setError(
          "Verification succeeded, but session activation failed. Please sign in again."
        );
      } else {
        setError(
          "Verification could not be completed. Please request a new code."
        );
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string }[] };
      setError(clerkErr.errors?.[0]?.longMessage ?? "Invalid code.");
    } finally {
      submittingVerificationRef.current = false;
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

  if (showCode) {
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
        Sign in to your account
      </h1>
      <p className="text-[15px] text-muted mb-8">
        Internal access only
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
          autoComplete="current-password"
          icon={<LockIcon className="h-5 w-5 shrink-0 text-muted" />}
        />

        <Link
          href="/forgot-password"
          className="-mt-1 self-end text-[13px] text-muted hover:text-foreground"
        >
          Forgot password?
        </Link>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={notReady || isLoading}
          className="w-full h-12 bg-accent hover:opacity-90 disabled:opacity-50 text-white text-[15px] font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}
