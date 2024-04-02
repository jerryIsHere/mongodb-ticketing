"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const regex_1 = require("../utils/regex");
class EmailService {
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
    sendEmail(to, subject, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const isValidEmail = regex_1.REGEX.EMAIL.test(to);
            if (!isValidEmail)
                throw {
                    error: { code: 400, message: "Invalid email address provided" },
                };
            yield this.transporter.verify();
            const emailOption = {
                from: process.env.EMAIL_SERVICE_ADDRESS,
                to: to,
                subject: subject,
                text: text,
            };
            try {
                yield this.transporter.sendMail(emailOption);
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
        });
    }
    resetPasswordEmail(to, resetToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sendEmail(to, "Reset Password", `Click the link below to reset your password:\n\nReset Link: ${process.env.BASE_PRODUCTION_URI}/reset-password/${resetToken}`);
            }
            catch (error) {
                throw error;
            }
        });
    }
    emailVerification(to, verificationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sendEmail(to, "Verify your email", `Click the link below to verify your email:\n\n Verification Link: ${process.env.BASE_PRODUCTION_URI}/verify/${verificationToken}`);
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = EmailService;
