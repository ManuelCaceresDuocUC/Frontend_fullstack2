// src/lib/sendEmail.ts
import nodemailer, { Transporter } from "nodemailer";

let cached: Transporter | null = null;

function getBool(v: string | undefined, def = false) {
  if (v == null) return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export function mailer() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE === "true") || port === 465;

  const allowSelfSigned = process.env.SMTP_ALLOW_SELF_SIGNED === "true";

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
  });
}
export type Attachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string; // opcional para inline images
};

export type SendArgs = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  replyTo?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
};

export async function sendEmail(args: SendArgs) {
  const tr = mailer();
  const from =
    args.from || process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@localhost";

  return tr.sendMail({
    from,
    to: args.to,
    cc: args.cc,
    bcc: args.bcc,
    subject: args.subject,
    text: args.text,
    html: args.html,
    attachments: args.attachments,
    replyTo: args.replyTo,
    headers: args.headers,
  });
}
