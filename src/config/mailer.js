const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

if (env.smtp.host && env.smtp.user && env.smtp.password) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password,
    },
  });
} else {
  logger.warn('[mailer] SMTP not fully configured — emails will be logged instead of sent.');
}

const layout = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <div style="background:#3c1f2b; padding: 20px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:22px;">${env.appName}</h1>
    </div>
    <div style="padding: 24px; background:#ffffff;">
      <h2 style="margin-top:0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding: 16px; text-align:center; font-size:12px; color:#999;">
      &copy; ${new Date().getFullYear()} ${env.appName}. All rights reserved.
    </div>
  </div>
`;

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    logger.info(`[mailer] (dry-run) To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${env.smtp.fromName}" <${env.smtp.fromAddress}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error(`[mailer] Failed to send email to ${to}: ${err.message}`);
  }
}

const templates = {
  welcome: (name) =>
    layout(
      `Welcome, ${name}!`,
      `<p>Thank you for creating an account with ${env.appName}. Explore our fresh flower collections curated for every occasion.</p>`,
    ),

  verifyEmail: (name, link) =>
    layout(
      'Verify your email',
      `<p>Hi ${name}, please verify your email address to activate your account.</p>
       <p><a href="${link}" style="background:#3c1f2b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Verify Email</a></p>
       <p>This link expires in 24 hours.</p>`,
    ),

  passwordReset: (name, link) =>
    layout(
      'Reset your password',
      `<p>Hi ${name}, we received a request to reset your password.</p>
       <p><a href="${link}" style="background:#3c1f2b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Reset Password</a></p>
       <p>If you did not request this, you can safely ignore this email. This link expires in 1 hour.</p>`,
    ),

  orderConfirmation: (name, order) =>
    layout(
      `Order Confirmed — #${order.orderNumber}`,
      `<p>Hi ${name}, thank you for your order! Here is your summary:</p>
       <table style="width:100%;border-collapse:collapse;">
         <tr><td style="padding:4px 0;">Order Number</td><td style="text-align:right;">${order.orderNumber}</td></tr>
         <tr><td style="padding:4px 0;">Payment Method</td><td style="text-align:right;">${order.paymentMethod}</td></tr>
         <tr><td style="padding:4px 0;">Total</td><td style="text-align:right;"><strong>AED ${order.total}</strong></td></tr>
       </table>
       <p>We will notify you once your order ships.</p>`,
    ),

  orderStatusUpdate: (name, order) =>
    layout(
      `Order #${order.orderNumber} Update`,
      `<p>Hi ${name}, your order status has been updated to: <strong>${order.status}</strong>.</p>`,
    ),

  contactReply: (name, originalMessage, replyMessage) =>
    layout(
      'Re: Your message to us',
      `<p>Hi ${name}, thank you for contacting ${env.appName}. Here is our reply:</p>
       <div style="background:#f7f2f4;padding:12px 16px;border-radius:6px;margin:12px 0;white-space:pre-wrap;">${replyMessage}</div>
       <p style="color:#888;font-size:13px;">Your original message: "${originalMessage}"</p>`,
    ),
};

module.exports = { sendMail, templates };
