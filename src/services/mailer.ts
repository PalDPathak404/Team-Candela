import nodemailer from 'nodemailer';

export async function sendPasswordEmail(to: string, password: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || 'no-reply@example.com';

  if (host && port && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject: 'Your new password',
      text: `Your password has been reset. Your new temporary password is: ${password}\n\nPlease log in and change it immediately.`,
    });
  } else {
    console.log(`[DEV EMAIL] To: ${to} | Password: ${password}`);
  }
}
