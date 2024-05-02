"use strict";
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
            var userObj = { _id: dao.id?.toString(), isCustomerSupport: dao.isCustomerSupport, hasAdminRight: dao.hasAdminRight, ...dao.Hydrated({ withCredentials: false }) };
            req.session.user = userObj;
            req.session.save();
        };
        var clearSession = (req, res) => {
            req.session.user = null;
        };
        user.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                user_1.UserDAO.listAll(res).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated({ withCredentials: false })) });
                }).catch((error) => next(error));
            }
        });
        user.post("/forget-password", async (req, res, next) => {
            if (req.body.email === undefined && req.body.username === undefined)
                res.status(400).send("Email Address / Username are Required.");
            // Generate a password reset token and save it in the user in the database
            const validUser = req.body.email != undefined ?
                await user_1.UserDAO.findByEmail(res, req.body.email) :
                await user_1.UserDAO.fetchByUsernameAndDeserialize(res, req.body.username);
            if (!validUser) {
                next(new database_1.RequestError("User not found."));
                // Send the password reset email containing the reset token
            }
            else {
                await validUser.sendResetPasswordEmail();
            }
            next({ success: true, message: "Password reset email sent." });
        });
        user.patch("/reset-password/:resetToken", async (req, res, next) => {
            const resetToken = req.params.resetToken;
            const newPassword = req.body.newPassword;
            if (resetToken && newPassword) {
                const validUser = await user_1.UserDAO.findByResetToken(res, resetToken);
                if (!validUser)
                    return next(new database_1.RequestError("Invalid or expired reset token."));
                // Reset the user's password and clear the reset token
                try {
                    await validUser.setPassword(newPassword);
                    validUser.resetToken = null;
                    await validUser.update();
                }
                catch (err) {
                    next(err);
                }
                res.status(200).json({ success: true, message: "Password reset successful." });
            }
            else {
                next(new database_1.RequestError("Reset token and new password are required."));
            }
        });
        user.use((req, res, next) => {
            if (false) {
            }
            else {
                next();
            }
        });
        user.patch("/:username", async (req, res, next) => {
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
        });
        user.put("/:userId", async (req, res, next) => { });
        user.post("/verify/:verificationToken", async (req, res, next) => {
            if (!req.params.verificationToken)
                next(new database_1.RequestError("Verification token is required."));
            user_1.UserDAO.VerifyWithToken(res, req.params.verificationToken).then((dao) => {
                updateSession(req, res, dao);
                next({ success: true, data: req.session.user });
            }).catch((error) => next(error));
        });
        user.post("/", async (req, res, next) => {
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
                if (process.env.ALLOW_USER_REGISTRATION?.toLocaleLowerCase() != "true")
                    return next(new database_1.RequestError("New user registration is not avaliable."));
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
                        .then(async (dao) => {
                        if (dao.id) {
                            updateSession(req, res, dao);
                            next({
                                success: true,
                                user: req.session.user,
                            });
                        }
                        return dao;
                    })
                        .then(async (dao) => {
                    })
                        .catch((error) => next(error));
                }
            }
            else if (req.query.resendVerification != undefined) {
                if (req.session['user'] && req.session['user']._id) {
                    user_1.UserDAO.getById(res, req.session['user']._id)
                        .then(dao => dao.sendActivationEmail())
                        .then(async (dao) => {
                        next({
                            success: true,
                            user: dao.Hydrated({ withCredentials: false }),
                        });
                    })
                        .catch((error) => next(error));
                }
            }
        });
        return user;
    }
    User.RouterFactory = RouterFactory;
})(User = exports.User || (exports.User = {}));
