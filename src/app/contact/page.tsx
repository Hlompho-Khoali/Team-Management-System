"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const enquiryRoles = [
  "CEO",
  "COO",
  "Recruiter",
  "HR Manager",
  "Hiring Manager",
  "Talent Acquisition Specialist",
  "Operations Manager",
  "Department Head",
  "Other",
];

const candidateRoles = [
  "Software developer",
  "Computer systems engineer",
  "Business analyst",
  "Data analyst",
  "UI/UX designer",
  "Project manager",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ email: "", cellNumber: "", role: "", description: "", lookingFor: "", duration: "" });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to send enquiry.");
      setSuccess(true);
      setMessage("Your enquiry has been sent. We will be in touch soon.");
      setForm({ email: "", cellNumber: "", role: "", description: "", lookingFor: "", duration: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send enquiry.");
    }
    setSubmitting(false);
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link href="/" style={brandStyle}>Work-Integrated Learning</Link>
        <p style={eyebrowStyle}>Contact Us</p>
        <h1 style={headingStyle}>Find the right student talent for your next opportunity.</h1>
        <p style={descriptionStyle}>Tell us what you need and our team will help you connect with skilled, employable students.</p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle} htmlFor="email">Your email</label>
          <input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@company.com" required style={inputStyle} />
          <label style={labelStyle} htmlFor="cellNumber">Cell number</label>
          <input id="cellNumber" type="tel" value={form.cellNumber} onChange={(event) => updateField("cellNumber", event.target.value)} placeholder="e.g. 082 123 4567" required style={inputStyle} />
          <label style={labelStyle} htmlFor="role">Your role or position</label>
          <select id="role" value={form.role} onChange={(event) => updateField("role", event.target.value)} required style={inputStyle}>
            <option value="">Select your role</option>
            {enquiryRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <label style={labelStyle} htmlFor="description">Project description</label>
          <textarea id="description" value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Tell us about the project or opportunity" rows={5} required style={textareaStyle} />
          <label style={labelStyle} htmlFor="lookingFor">What young professionals are you looking for?</label>
          <select id="lookingFor" value={form.lookingFor} onChange={(event) => updateField("lookingFor", event.target.value)} required style={inputStyle}>
            <option value="">Select the profile you need</option>
            {candidateRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <label style={labelStyle} htmlFor="duration">Duration</label>
          <input id="duration" value={form.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="e.g. 3 months or full-time" required style={inputStyle} />
          <button type="submit" disabled={submitting} style={buttonStyle}>{submitting ? "Sending enquiry..." : "Send enquiry"}</button>
          {message && <p style={success ? successStyle : errorStyle}>{message}</p>}
        </form>
        <Link href="/" style={backLinkStyle}>Back to home</Link>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", padding: "60px 20px", background: "linear-gradient(135deg, #f5f1ea 0%, #eee7dc 50%, #e4ddd2 100%)", color: "#222222" };
const cardStyle = { width: "100%", maxWidth: "680px", padding: "48px", background: "#ffffff", borderRadius: "18px", border: "1px solid #e5dfd6", boxSizing: "border-box" as const };
const brandStyle = { color: "#222222", fontSize: "20px", fontWeight: 700, textDecoration: "none" };
const eyebrowStyle = { margin: "34px 0 8px", color: "#8a8175", fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const };
const headingStyle = { margin: 0, fontSize: "42px", lineHeight: 1.1 };
const descriptionStyle = { margin: "18px 0 0", color: "#716b63", lineHeight: 1.7 };
const formStyle = { display: "flex", flexDirection: "column" as const, marginTop: "30px" };
const labelStyle = { margin: "16px 0 7px", color: "#333333", fontSize: "14px", fontWeight: 600 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "13px 14px", border: "1px solid #d8d0c5", borderRadius: "10px", background: "#ffffff", color: "#222222", fontSize: "14px" };
const textareaStyle = { ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" };
const buttonStyle = { marginTop: "24px", padding: "13px 18px", border: "none", borderRadius: "10px", background: "#222222", color: "#ffffff", fontSize: "14px", fontWeight: 700, cursor: "pointer" };
const successStyle = { color: "#35613d", lineHeight: 1.5 };
const errorStyle = { color: "#a33a3a", lineHeight: 1.5 };
const backLinkStyle = { display: "inline-block", marginTop: "24px", color: "#4f5f70", fontSize: "14px", fontWeight: 600, textDecoration: "none" };