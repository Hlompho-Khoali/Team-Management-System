
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("email not confirmed")) {
        setMessage(
          "Please confirm your email address using the link sent after signup, then try again.",
        );
      } else if (errorMessage.includes("rate limit")) {
        setMessage(
          "Too many authentication emails were requested. Wait a while before trying again.",
        );
      } else if (errorMessage.includes("invalid login credentials")) {
        setMessage("The email or password is incorrect.");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Unable to retrieve your account.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setMessage(
        "Your login succeeded, but your account profile is not ready. Please contact an administrator.",
      );
      setLoading(false);
      return;
    }

    if (profile.role === "manager") {
      window.location.href = "/manager";
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background:
          "linear-gradient(135deg, #f5f1ea 0%, #eee7dc 50%, #e4ddd2 100%)",
      }}
    >
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ marginBottom: "36px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#222222",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            Work-Integrated Learning
          </Link>

          <p
            style={{
              marginTop: "32px",
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#8a8175",
            }}
          >
            Company Workspace
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              lineHeight: 1.15,
              color: "#222222",
            }}
          >
            {forgotPassword ? "Reset your password." : "Welcome back."}
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#716b63",
              lineHeight: 1.6,
            }}
          >
            {forgotPassword
              ? "Enter your email and we will send you a secure reset link."
              : "Sign in to continue to your Work-Integrated Learning workspace."}
          </p>
        </div>

        <form onSubmit={forgotPassword ? handleForgotPassword : handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#333333",
              }}
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 16px",
                border: "1px solid #ddd6cc",
                borderRadius: "12px",
                fontSize: "15px",
                outline: "none",
                background: "#faf9f7",
              }}
            />
          </div>

          {!forgotPassword && <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#333333",
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 16px",
                border: "1px solid #ddd6cc",
                borderRadius: "12px",
                fontSize: "15px",
                outline: "none",
                background: "#faf9f7",
              }}
            />
          </div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "12px",
              padding: "15px",
              background: "#222222",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? forgotPassword
                ? "Sending link..."
                : "Signing in..."
              : forgotPassword
                ? "Send reset link"
                : "Sign In"}
          </button>

          {message && (
            <p
              style={{
                marginTop: "18px",
                color: "#a33a3a",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}
        </form>

        <button
          type="button"
          onClick={() => {
            setForgotPassword((current) => !current);
            setMessage("");
          }}
          style={forgotPasswordLinkStyle}
        >
          {forgotPassword ? "Back to sign in" : "Forgot password?"}
        </button>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #eee9e2",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#716b63",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back to Work-Integrated Learning
          </Link>
        </div>
      </div>
    </main>
  );
}

const forgotPasswordLinkStyle = {
  display: "block",
  margin: "18px auto 0",
  border: "none",
  background: "transparent",
  color: "#4f5f70",
  fontSize: "14px",
  cursor: "pointer",
};


