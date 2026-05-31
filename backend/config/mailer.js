import nodemailer from 'nodemailer';

let transporter = null;

// Initialize Mailer Transporter
const getTransporter = async () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    console.log("Mailer: Using configured SMTP server settings.");
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for others
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    console.log("Mailer: Missing SMTP credentials. Generating Ethereal Mock Test account...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Mailer: Ethereal test account created successfully: User: ${testAccount.user}`);
    } catch (err) {
      console.error("Mailer: Failed to create Ethereal mock account:", err.message);
      throw err;
    }
  }

  return transporter;
};

// Dispatch email welcome message (Disabled on account activation)
export const sendWelcomeEmail = async (toEmail, userName, selectedDomains, rawPassword = null) => {
  console.log(`Mailer: Welcome email skipped for ${userName} (${toEmail}) - emailing is disabled on activation.`);
  return { success: true, messageId: 'disabled-welcome-email' };
};

// Dispatch email verification message (Disabled)
export const sendVerificationEmail = async (toEmail, userName, otp, token) => {
  console.log(`Mailer: Verification email skipped for ${userName} (${toEmail}) - emailing is disabled.`);
  return { success: true, messageId: 'disabled-verification-email' };
};
