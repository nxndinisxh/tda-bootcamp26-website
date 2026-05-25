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

// Dispatch email welcome message
export const sendWelcomeEmail = async (toEmail, userName, selectedDomains, rawPassword = null) => {
  try {
    const mailTransporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"TDA Bootcamp Organizers" <noreply@manipal.edu>';

    const domainListHtml = selectedDomains.length > 0 
      ? selectedDomains.map(d => `<li style="margin-bottom: 6px; font-weight: bold; color: #60a6dc;">✦ ${d}</li>`).join('')
      : `<li style="font-style: italic; color: #a0aec0;">No tracks selected yet (onboarding required)</li>`;

    const credentialsHtml = rawPassword 
      ? `<div style="background-color: rgba(96, 166, 220, 0.08); border: 1px solid rgba(96, 166, 220, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0;">
           <p style="margin: 0 0 8px 0; font-size: 14px; font-family: sans-serif; color: #ccd6f6;"><strong>Registered Email:</strong> ${toEmail}</p>
           <p style="margin: 0; font-size: 14px; font-family: sans-serif; color: #ccd6f6;"><strong>Password:</strong> <code style="background-color: #02223e; padding: 3px 6px; border-radius: 4px; color: #60a6dc; font-weight: bold;">${rawPassword}</code></p>
         </div>`
      : `<div style="background-color: rgba(212, 193, 182, 0.08); border: 1px solid rgba(212, 193, 182, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0;">
           <p style="margin: 0 0 8px 0; font-size: 14px; font-family: sans-serif; color: #ccd6f6;"><strong>SSO Integration:</strong> Microsoft SSO enabled</p>
           <p style="margin: 0; font-size: 14px; font-family: sans-serif; color: #ccd6f6;">Log in securely using your university Microsoft Account details.</p>
         </div>`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TDA Bootcamp 2026</title>
      </head>
      <body style="background-color: #02223e; color: #f3f4f6; font-family: sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: rgba(6, 42, 73, 0.65); border: 1px solid rgba(212, 193, 182, 0.15); border-radius: 28px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid rgba(212, 193, 182, 0.12); padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #60a6dc; letter-spacing: 2px;">✦ TDA BOOTCAMP 2026 ✦</span>
          </div>

          <!-- Body -->
          <h2 style="font-size: 20px; color: #fff; margin-top: 0; font-weight: 700;">Registration Confirmed!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a0aec0;">Hello <strong style="color: #fff;">${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #a0aec0;">Welcome to the Manipal University TDA Bootcamp 2026. Your operational portal account has been successfully set up with the following details:</p>

          ${credentialsHtml}

          <h3 style="font-size: 15px; color: #fff; border-bottom: 1px solid rgba(212, 193, 182, 0.12); padding-bottom: 8px; margin-top: 30px;">Selected Tracks:</h3>
          <ul style="list-style-type: none; padding-left: 0; font-size: 14px;">
            ${domainListHtml}
          </ul>

          <p style="font-size: 14px; line-height: 1.6; color: #a0aec0; margin-top: 30px;">
            Please log in to check announcements, access weekly reading resources, and view the track leaderboards.
          </p>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(212, 193, 182, 0.12); font-size: 11px; text-align: center; color: #718096;">
            <p style="margin: 0;">This is an automated notification from the TDA Bootcamp 2026 System.</p>
            <p style="margin: 5px 0 0 0;">Manipal Academy of Higher Education</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: '✦ Welcome to TDA Bootcamp 2026 - Registration Confirmed ✦',
      html: htmlBody,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Mailer: Email successfully sent to ${toEmail}. MessageID: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`Mailer (Ethereal Debug): Preview URL available at: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Mailer: Failed to send welcome email to ${toEmail}:`, err.message);
    return { success: false, error: err.error || err.message };
  }
};

// Dispatch email verification message (OTP & Link)
export const sendVerificationEmail = async (toEmail, userName, otp, token) => {
  try {
    const mailTransporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"TDA Bootcamp Organizers" <noreply@manipal.edu>';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify?token=${token}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your TDA Bootcamp Email</title>
      </head>
      <body style="background-color: #02223e; color: #f3f4f6; font-family: sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: rgba(6, 42, 73, 0.65); border: 1px solid rgba(212, 193, 182, 0.15); border-radius: 28px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid rgba(212, 193, 182, 0.12); padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #60a6dc; letter-spacing: 2px;">✦ TDA BOOTCAMP 2026 ✦</span>
          </div>

          <!-- Body -->
          <h2 style="font-size: 20px; color: #fff; margin-top: 0; font-weight: 700; text-align: center;">Email Verification Required</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a0aec0;">Hello <strong style="color: #fff;">${userName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #a0aec0;">Thank you for registering for the TDA Bootcamp 2026. Please verify your email using one of the two methods below:</p>

          <!-- OTP Code Section -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; tracking-wider; color: #d4c1b6; margin-bottom: 10px;">Method 1: Enter OTP Verification Code</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #02223e; background-color: #f3f4f6; border: 2px solid #60a6dc; border-radius: 16px; padding: 18px; display: inline-block; min-width: 200px; text-shadow: none;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #718096; margin-top: 8px;">This code expires in 15 minutes.</p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <span style="background-color: #062a49; border: 1px solid rgba(212, 193, 182, 0.15); padding: 4px 12px; border-radius: 9999px; font-size: 12px; color: #718096; text-transform: uppercase; font-weight: bold;">or</span>
          </div>

          <!-- Verification Link Section -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; tracking-wider; color: #d4c1b6; margin-bottom: 15px;">Method 2: Click the Verification Link</p>
            <a href="${verificationLink}" target="_blank" style="background-color: #60a6dc; color: #02223e; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; transition: background-color 0.2s;">
              Verify Email Now
            </a>
            <p style="font-size: 12px; color: #718096; margin-top: 10px;">This link is valid for 24 hours.</p>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #718096; margin-top: 30px; text-align: center;">
            If you did not request this registration, you can safely ignore this email.
          </p>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(212, 193, 182, 0.12); font-size: 11px; text-align: center; color: #718096;">
            <p style="margin: 0;">This is an automated verification message from the TDA Bootcamp 2026 System.</p>
            <p style="margin: 5px 0 0 0;">Manipal Academy of Higher Education</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: '✦ Action Required: Verify Your TDA Bootcamp Email ✦',
      html: htmlBody,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Mailer: Verification email sent to ${toEmail}. MessageID: ${info.messageId}`);
    
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`Mailer (Ethereal Debug): Preview URL available at: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Mailer: Failed to send verification email to ${toEmail}:`, err.message);
    return { success: false, error: err.error || err.message };
  }
};
