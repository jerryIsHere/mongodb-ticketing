import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { REGEX } from "../utils/regex";
import Mail from "nodemailer/lib/mailer";

export default class EmailService {
  static singleton = new EmailService()
  transporter: nodemailer.Transporter;
  option: SMTPTransport.Options;
  constructor() {
    this.option = {
      service: process.env.EMAIL_SERVICE || "yahoo",
      host: process.env.EMAIL_SERVICE_HOST || "smtp.mail.yahoo.com",
      port: 465,
      secure: true,
      logger: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_SERVICE_ADDRESS || "",
        pass: process.env.EMAIL_SERVICE_PASSWORD || "",
      },
    };
    this.transporter = nodemailer.createTransport(this.option);
  }

  async sendEmail(to: string, subject: string, text: string) {
    to = to.toLowerCase()
    const isValidEmail = REGEX.EMAIL.test(to);
    if (!isValidEmail)
      throw {
        error: { code: 400, message: "Invalid email address provided" },
      };
    await this.transporter.verify();
    const emailOption: Mail.Options = {
      from: process.env.EMAIL_SERVICE_ADDRESS,
      to: to,
      subject: subject,
      text: text,
    };
    try {
      await this.transporter.sendMail(emailOption);
      return {
        success: {
          code: 200,
          message: "Email sent successfully.",
        },
      };
    } catch (error) {
      console.error("[Nodemailer Error]: \n", error);
      throw {
        error: { code: 500, message: "Email Service Error" },
      };
    }
  }
  async resetPasswordEmail(username: string, to: string, resetToken: string) {
    try {
      await this.sendEmail(
        to,
        "Reset Password",
        `Click the link below to reset your (${username}) password:\n\nReset Link: ${process.env.BASE_PRODUCTION_URI}/reset-password/${resetToken}`
      );
    } catch (error) {
      throw error;
    }
  }

  async emailVerification(to: string, verificationToken: string) {
    try {
      await this.sendEmail(
        to,
        "Verify your email",
        `Click the link below to verify your email:\n\n Verification Link: ${process.env.BASE_PRODUCTION_URI}/verify/${verificationToken}`
      );
    } catch (error) {
      throw error;
    }
  }
}
