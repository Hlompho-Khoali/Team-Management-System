import { NextResponse } from "next/server";

const RECIPIENT_EMAIL = "edbooksa@gmail.com";

type Enquiry = {
  email?: unknown;
  cellNumber?: unknown;
  role?: unknown;
  description?: unknown;
  lookingFor?: unknown;
  duration?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let enquiry: Enquiry;
  try {
    enquiry = (await request.json()) as Enquiry;
  } catch {
    return NextResponse.json({ error: "Invalid enquiry." }, { status: 400 });
  }

  const email = text(enquiry.email);
  const cellNumber = text(enquiry.cellNumber);
  const role = text(enquiry.role);
  const description = text(enquiry.description);
  const lookingFor = text(enquiry.lookingFor);
  const duration = text(enquiry.duration);
  if (!email || !cellNumber || !role || !description || !lookingFor || !duration) {
    return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Enquiries are not configured yet." }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [RECIPIENT_EMAIL],
      reply_to: email,
      subject: `New company enquiry: ${role}`,
      text: `Sender email: ${email}\nCell number: ${cellNumber}\nRole: ${role}\nWhat they are looking for: ${lookingFor}\nDuration: ${duration}\n\nProject description:\n${description}`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to send enquiry right now." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
