import nodemailer from "nodemailer";

export type Attachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string;
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

export function mailer() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true"; // usa true solo si es 465
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) throw new Error("SMTP_USER/SMTP_PASS no configurados");

  // opcional dev: tolerar self-signed si definiste SMTP_ALLOW_SELF_SIGNED
  const tls =
    process.env.SMTP_ALLOW_SELF_SIGNED === "true" ? { rejectUnauthorized: false } : undefined;

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls });
}

export async function sendEmail(args: SendArgs) {
  const tr = mailer();
  const from = args.from || process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@localhost";
  return tr.sendMail({ from, ...args });
}
