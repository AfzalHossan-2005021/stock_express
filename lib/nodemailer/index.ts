import nodemailer from "nodemailer";
import { NEWS_SUMMARY_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "./templates";

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
};