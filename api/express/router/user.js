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
exports.User = void 0;
const express_1 = require("express");
const database_1 = require("../dao/database");
const user_1 = require("../dao/user");
const email_1 = __importDefault(require("../../services/email"));
const token_1 = require("../../utils/token");
var User;
(function (User) {
    function RouterFactory() {
        var user = (0, express_1.Router)();
        const emailService = new email_1.default();
        user.post("/forget-password", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.body.type)
                res.status(400).send("Missing type.");
            if (["email", "username"].includes(req.body.type))
                res.status(400).send("Invalid type.");
            if (!req.body.email && !req.body.username)
                res.status(400).send("Email Address / Username are Required.");
            // Generate a password reset token and save it in the user in the database
            const validUser = req.body.type === "email" ?
                yield user_1.UserDAO.findByEmail(res, req.body.email) :
                yield user_1.UserDAO.fetchByUsernameAndDeserialize(res, req.body.username);
            if (!validUser)
                return next(new database_1.RequestError("User not found."));
            const resetToken = yield (0, token_1.generateResetToken)();
            validUser.resetToken = resetToken;
            yield validUser.update(validUser);
            // Send the password reset email containing the reset token
            emailService.resetPasswordEmail(validUser.email, resetToken);
            res.json({ success: true, message: "Password reset email sent." });
        }));
        user.patch("/reset-password/:resetToken", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const resetToken = req.params.resetToken;
            const newPassword = req.body.newPassword;
            if (resetToken && newPassword) {
                const validUser = yield user_1.UserDAO.findByResetToken(res, resetToken);
                if (!validUser)
                    return next(new database_1.RequestError("Invalid or expired reset token."));
                // Reset the user's password and clear the reset token
                yield validUser.setPassword(newPassword);
                validUser.resetToken = null;
                yield validUser.update(validUser);
                res.status(200).json({ success: true, message: "Password reset successful." });
            }
            else {
                next(new database_1.RequestError("Reset token and new password are required."));
            }
        }));
        user.use((req, res, next) => {
            if (false) {
            }
            else {
                next();
            }
        });
        user.patch("/:userId", (req, res, next) => __awaiter(this, void 0, void 0, function* () { }));
        user.put("/:userId", (req, res, next) => __awaiter(this, void 0, void 0, function* () { }));
        user.post("/verify/:verificationToken", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.params.verificationToken)
                next(new database_1.RequestError("Verification token is required."));
            const user = yield user_1.UserDAO.findByVerificationToken(res, req.params.verificationToken);
            if (!user)
                return next(new database_1.RequestError("User not found."));
            user.verified = true;
            user.verificationToken = null;
            yield user.update(user);
            res.json({ success: true, message: "Email verification successful." });
        }));
        user.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.login != undefined) {
                if (req.body.password) {
                    user_1.UserDAO.login(res, req.body.username, req.body.password).then(user => {
                        req.session['user'] = user.withoutCredential();
                        res.cookie("user", JSON.stringify(Object.assign(Object.assign({}, user.withoutCredential().Hydrated()), { hasAdminRight: user.hasAdminRight() })));
                        next({ success: true, message: user.withoutCredential().Hydrated() });
                    }).catch((error) => next(error));
                }
                else {
                    next(new database_1.RequestError("A login must be done with a password."));
                }
            }
            else if (req.query.logout != undefined) {
                req.session["user"] = null;
                res.clearCookie("user");
                res.json({ success: true });
            }
            else if (req.query.register != undefined) {
                if (req.body.username &&
                    req.body.fullname &&
                    req.body.email &&
                    req.body.password) {
                    var dao = new user_1.UserDAO(res, {
                        username: req.body.username,
                        fullname: req.body.fullname,
                        email: req.body.email,
                        singingPart: req.body.singingPart,
                        verified: false,
                    });
                    dao
                        .setPassword(req.body.password)
                        .then((dao) => dao.create())
                        .then((dao) => __awaiter(this, void 0, void 0, function* () {
                        yield emailService.emailVerification(req.body.email, yield (0, token_1.generateResetToken)());
                        if (dao.id) {
                            req.session["user"] = dao.withoutCredential();
                            res.cookie("user", JSON.stringify(dao.withoutCredential().Hydrated()));
                            res.json({
                                success: true,
                                user: dao.withoutCredential().Hydrated(),
                            });
                        }
                    }))
                        .catch((error) => next(error));
                }
            }
        }));
        return user;
    }
    User.RouterFactory = RouterFactory;
})(User = exports.User || (exports.User = {}));
