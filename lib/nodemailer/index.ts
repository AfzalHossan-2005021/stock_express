import nodemailer from "nodemailer";
import { NEWS_SUMMARY_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "./templates";
import { PASSWORD_RESET_EMAIL_TEMPLATE } from "./password-reset-template";

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE
    .replace('{{name}}', name)
    .replace('{{intro}}', intro);

  const mailOptions = {
    from: `'Stock Express' <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: 'Welcome to Stock Express!',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
  }
}

export const sendNewsSummaryEmail = async (
  { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace('{{date}}', date)
    .replace('{{newsContent}}', newsContent);

  const mailOptions = {
    from: `'Stock Express' <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Stock Express`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`News summary email sent to ${email} for date ${date}`);
  } catch (error) {
    console.error(`Error sending news summary email to ${email}:`, error);
    throw error;
  }
}

export const sendPasswordResetEmail = async ({ email, resetLink }: { email: string; resetLink: string }): Promise<void> => {
  let htmlTemplate = PASSWORD_RESET_EMAIL_TEMPLATE
    .replaceAll('RESET_LINK_PLACEHOLDER', resetLink)
    .replace('{{year}}', new Date().getFullYear().toString());

  console.log('Password reset email prepared for:', email);
  console.log('Reset link used:', resetLink);

  const mailOptions = {
    from: `'Stock Express' <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: 'Reset Your Stock Express Password',
    text: `Click the link to reset your password: ${resetLink}`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw error;
  }
};