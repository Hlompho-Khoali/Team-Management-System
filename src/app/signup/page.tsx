"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    /*
     * Create the authentication account.
     *
     * The full name is included in user metadata so that
     * our profile creation trigger can use it when creating
     * the profiles row.
     */
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("Your account could not be created. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      data.session
        ? "Your account has been created successfully. You can sign in now."
        : "Your account was created. Check your email and click the confirmation link before signing in.",
    );

    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setLoading(false);
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
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "34px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#222222",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            EdBook
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
            Create your account.
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#716b63",
              lineHeight: 1.6,
            }}
          >
            Create your EdBook employee account to access your company
            workspace.
          </p>
        </div>

        <form onSubmit={handleSignup}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label htmlFor="firstName" style={labelStyle}>
                First name
              </label>

              <input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="lastName" style={labelStyle}>
                Last name
              </label>

              <input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="email" style={labelStyle}>
              Work email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="confirmPassword" style={labelStyle}>
              Confirm password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

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
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {message && (
            <p
              style={{
                marginTop: "18px",
                color: success ? "#4d6b50" : "#a33a3a",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          )}
        </form>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #eee9e2",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              color: "#716b63",
              fontSize: "14px",
            }}
          >
            Already have an account?
          </p>

          <Link
            href="/login"
            style={{
              color: "#222222",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Sign in to EdBook →
          </Link>
        </div>

        <div
          style={{
            marginTop: "22px",
            textAlign: "center",
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
            ← Back to EdBook
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#333333",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px 16px",
  border: "1px solid #ddd6cc",
  borderRadius: "12px",
  fontSize: "15px",
  outline: "none",
  background: "#faf9f7",
};
