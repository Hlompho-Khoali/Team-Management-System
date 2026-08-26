"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
    } else {
      setSuccess(true);
      setMessage("Your password has been reset successfully.");
      setPassword("");
      setConfirmation("");
    }
    setLoading(false);
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <Link href="/" style={brandStyle}>Work-Integrated Learning</Link>
        <p style={eyebrowStyle}>Account recovery</p>
        <h1 style={headingStyle}>Choose a new password.</h1>
        <p style={descriptionStyle}>Set a new password for your Work-Integrated Learning account.</p>
        <form onSubmit={handleReset}>
          <label style={labelStyle} htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            style={inputStyle}
          />
          <label style={labelStyle} htmlFor="confirmation">Confirm password</label>
          <input
            id="confirmation"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={6}
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Updating..." : "Reset password"}
          </button>
          {message && <p style={success ? successStyle : errorStyle}>{message}</p>}
        </form>
        {success && <Link href="/login" style={loginLinkStyle}>Return to sign in</Link>}
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(135deg, #f5f1ea 0%, #eee7dc 50%, #e4ddd2 100%)" };
const cardStyle = { width: "100%", maxWidth: "460px", padding: "48px", boxSizing: "border-box" as const, background: "#ffffff", borderRadius: "24px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)" };
const brandStyle = { color: "#222222", fontSize: "24px", fontWeight: 700, textDecoration: "none" };
const eyebrowStyle = { marginTop: "32px", marginBottom: "8px", color: "#8a8175", fontSize: "13px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" as const };
const headingStyle = { margin: 0, color: "#222222", fontSize: "36px", lineHeight: 1.15 };
const descriptionStyle = { marginTop: "14px", color: "#716b63", lineHeight: 1.6 };
const labelStyle = { display: "block", margin: "20px 0 8px", color: "#333333", fontSize: "14px", fontWeight: 600 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "14px 16px", border: "1px solid #ddd6cc", borderRadius: "12px", fontSize: "15px", background: "#faf9f7" };
const buttonStyle = { width: "100%", marginTop: "24px", border: "none", borderRadius: "12px", padding: "15px", background: "#222222", color: "#ffffff", fontSize: "15px", fontWeight: 600, cursor: "pointer" };
const successStyle = { marginTop: "18px", color: "#35613d", fontSize: "14px" };
const errorStyle = { marginTop: "18px", color: "#a33a3a", fontSize: "14px" };
const loginLinkStyle = { display: "inline-block", marginTop: "20px", color: "#4f5f70", fontSize: "14px", textDecoration: "none" };