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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const express_1 = require("express");
const database_1 = require("../dao/database");
const user_1 = require("../dao/user");
var User;
(function (User) {
    function RouterFactory() {
        var user = (0, express_1.Router)();
        var updateSession = (req, res, dao) => {
            var _a;
            var userObj = Object.assign({ _id: (_a = dao.id) === null || _a === void 0 ? void 0 : _a.toString(), hasAdminRight: dao.hasAdminRight() }, dao.Hydrated({ withCredentials: false }));
            req.session.user = userObj;
            req.session.save();
        };
        var clearSession = (req, res) => {
            req.session.user = null;
        };
        user.get("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.list != undefined) {
                user_1.UserDAO.listAll(res).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated({ withCredentials: false })) });
                }).catch((error) => next(error));
            }
        }));
        user.post("/forget-password", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.body.email === undefined && req.body.username === undefined)
                res.status(400).send("Email Address / Username are Required.");
            // Generate a password reset token and save it in the user in the database
            const validUser = req.body.email != undefined ?
                yield user_1.UserDAO.findByEmail(res, req.body.email) :
                yield user_1.UserDAO.fetchByUsernameAndDeserialize(res, req.body.username);
            if (!validUser) {
                next(new database_1.RequestError("User not found."));
                // Send the password reset email containing the reset token
            }
            else {
                yield validUser.sendResetPasswordEmail();
            }
            next({ success: true, message: "Password reset email sent." });
        }));
        user.patch("/reset-password/:resetToken", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const resetToken = req.params.resetToken;
            const newPassword = req.body.newPassword;
            if (resetToken && newPassword) {
                const validUser = yield user_1.UserDAO.findByResetToken(res, resetToken);
                if (!validUser)
                    return next(new database_1.RequestError("Invalid or expired reset token."));
                // Reset the user's password and clear the reset token
                try {
                    yield validUser.setPassword(newPassword);
                    validUser.resetToken = null;
                    yield validUser.update();
                }
                catch (err) {
                    next(err);
                }
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
        user.patch("/:username", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.params.username && typeof req.params.username == "string") {
                if (req.query.profile != undefined) {
                    user_1.UserDAO.fetchByUsernameAndDeserialize(res, req.params.username).then((dao) => {
                        dao.email = req.body.email;
                        dao.fullname = req.body.fullname;
                        dao.singingPart = req.body.singingPart;
                        return dao.update();
                    }).then((dao) => {
                        updateSession(req, res, dao);
                        next({ success: true, data: req.session.user });
                    }).catch((error) => next(error));
                }
                else if (req.query.password != undefined) {
                    user_1.UserDAO.fetchByUsernameAndDeserialize(res, req.params.username)
                        .then((dao) => dao.setPassword(req.body.password)).then((dao) => dao.update())
                        .then((dao) => {
                        next({ success: true, data: dao.Hydrated({ withCredentials: false }) });
                    }).catch((error) => next(error));
                }
            }
        }));
        user.put("/:userId", (req, res, next) => __awaiter(this, void 0, void 0, function* () { }));
        user.post("/verify/:verificationToken", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.params.verificationToken)
                next(new database_1.RequestError("Verification token is required."));
            user_1.UserDAO.VerifyWithToken(res, req.params.verificationToken).then((dao) => {
                updateSession(req, res, dao);
                next({ success: true, data: req.session.user });
            }).catch((error) => next(error));
        }));
        user.post("/", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (req.query.login != undefined) {
                if (req.body.password) {
                    user_1.UserDAO.login(res, req.body.username, req.body.password).then(dao => {
                        updateSession(req, res, dao);
                        next({ success: true, data: req.session.user });
                    }).catch((error) => next(error));
                }
                else {
                    next(new database_1.RequestError("A login must be done with a password."));
                }
            }
            else if (req.query.logout != undefined) {
                clearSession(req, res);
                res.clearCookie("user");
                next({ success: true });
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
                    });
                    dao
                        .setPassword(req.body.password)
                        .then((dao) => dao.create())
                        .then((dao) => __awaiter(this, void 0, void 0, function* () {
                        if (dao.id) {
                            updateSession(req, res, dao);
                            next({
                                success: true,
                                user: req.session.user,
                            });
                        }
                        return dao;
                    }))
                        .then((dao) => __awaiter(this, void 0, void 0, function* () {
                    }))
                        .catch((error) => next(error));
                }
            }
            else if (req.query.resendVerification != undefined) {
                if (req.session['user'] && req.session['user']._id) {
                    user_1.UserDAO.getById(res, req.session['user']._id)
                        .then(dao => dao.sendActivationEmail())
                        .then((dao) => __awaiter(this, void 0, void 0, function* () {
                        next({
                            success: true,
                            user: dao.Hydrated({ withCredentials: false }),
                        });
                    }))
                        .catch((error) => next(error));
                }
            }
        }));
        return user;
    }
    User.RouterFactory = RouterFactory;
})(User = exports.User || (exports.User = {}));
