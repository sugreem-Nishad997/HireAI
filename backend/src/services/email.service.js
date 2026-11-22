import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASS || "";
    // Gmail app passwords often contain spaces (e.g. "abcd efgh ijkl mnop")
    const pass = rawPass.replace(/\s+/g, "");

    if (process.env.EMAIL_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 465,
        secure: process.env.EMAIL_SECURE !== "false",
        auth: { user, pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: { user, pass },
      });
    }
  }
  return transporter;
};

const generateOtpEmailHtml = ({ title, heading, description, otp, expiryMinutes = 10 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
    }
    .wrapper {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #2563eb;
      padding: 28px 24px;
      text-align: center;
    }
    .brand-name {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .body {
      padding: 32px 28px;
    }
    .heading {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .text {
      margin: 0 0 20px 0;
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
    }
    .otp-card {
      background: #f1f5f9;
      border: 2px dashed #93c5fd;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #1d4ed8;
      margin: 0;
    }
    .otp-expiry {
      font-size: 13px;
      color: #64748b;
      margin-top: 8px;
    }
    .security-notice {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-name">HireAI</h1>
    </div>
    <div class="body">
      <h2 class="heading">${heading}</h2>
      <p class="text">${description}</p>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">This code will expire in ${expiryMinutes} minutes</div>
      </div>

      <p class="security-notice">
        If you did not request this verification code, please ignore this email or contact support if you have concerns. Never share this code with anyone.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} HireAI Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const sendOtpEmail = async (toEmail, otp, purpose) => {
  const isRegistration = purpose === "registration";

  const title = isRegistration
    ? "Verify Your Email - HireAI"
    : "Reset Your Password - HireAI";

  const heading = isRegistration
    ? "Verify Your Email Address"
    : "Password Reset Code";

  const description = isRegistration
    ? "Thank you for creating an account with HireAI. To finish setting up your account, please enter the 6-digit verification code below:"
    : "We received a request to reset the password for your HireAI account. Enter the 6-digit code below to set a new password:";

  const html = generateOtpEmailHtml({
    title,
    heading,
    description,
    otp,
    expiryMinutes: 10,
  });

  const text = `${heading}\n\n${description}\n\nYour code: ${otp}\n(Valid for 10 minutes)\n\nIf you did not request this, please ignore this email.`;

  const sender = process.env.EMAIL_FROM || `"HireAI" <${process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: sender,
    to: toEmail,
    subject: title,
    text,
    html,
  };

  const transport = getTransporter();

  // Log OTP in development console for convenience
  console.log(`[EmailService] Sending ${purpose} OTP [${otp}] to ${toEmail}`);

  const info = await transport.sendMail(mailOptions);
  console.log(`[EmailService] Email sent successfully to ${toEmail}: ${info.messageId}`);
  return info;
};
