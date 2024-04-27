"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const regex_1 = require("../utils/regex");
class EmailService {
    static singleton = new EmailService();
    transporter;
    option;
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
        this.transporter = nodemailer_1.default.createTransport(this.option);
    }
    async sendEmail(to, subject, text) {
        to = to.toLowerCase();
        const isValidEmail = regex_1.REGEX.EMAIL.test(to);
        if (!isValidEmail)
            throw {
                error: { code: 400, message: "Invalid email address provided" },
            };
        await this.transporter.verify();
        const emailOption = {
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
        }
        catch (error) {
            console.error("[Nodemailer Error]: \n", error);
            throw {
                error: { code: 500, message: "Email Service Error" },
            };
        }
    }
    async resetPasswordEmail(username, to, resetToken) {
        try {
            await this.sendEmail(to, "Reset Password", `Click the link below to reset your (${username}) password:\n\nReset Link: ${process.env.BASE_PRODUCTION_URI}/reset-password/${resetToken}`);
        }
        catch (error) {
            throw error;
        }
    }
    async emailVerification(to, verificationToken) {
        try {
            await this.sendEmail(to, "Verify your email", `Click the link below to verify your email:\n\n Verification Link: ${process.env.BASE_PRODUCTION_URI}/verify/${verificationToken}`);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = EmailService;
