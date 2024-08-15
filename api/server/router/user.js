"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const express_1 = require("express");
const database_1 = require("../database/database");
const user_1 = require("../../mongoose-schema/v1/user");
var User;
(function (User) {
    function RouterFactory() {
        var user = (0, express_1.Router)();
        user.use((req, res, next) => {
            if (req.method == 'POST' && req.query.register != undefined && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        var updateSession = (req, res, user) => {
            req.session.user = user;
            req.session.save();
        };
        var clearSession = (req, res) => {
            req.session.user = null;
        };
        user.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                next({ success: true, data: await user_1.userModel.find().then(docs => docs.map(doc => doc.disclose())) });
            }
        });
        user.post("/forget-password", async (req, res, next) => {
            if (req.body.email === undefined && req.body.username === undefined)
                res.status(400).send("Email Address / Username are Required.");
            // Generate a password reset token and save it in the user in the database
            const validUser = req.body.email != undefined ?
                await user_1.userModel.findOne({ email: req.body.email }).exec() :
                await user_1.userModel.findOne({ username: req.body.username }).exec();
            if (!validUser) {
                next(new database_1.RequestError("User not found."));
                // Send the password reset email containing the reset token
            }
            else {
                await validUser.sendResetPasswordEmail();
                next({ success: true, message: "Password reset email sent." });
            }
        });
        user.patch("/reset-password/:resetToken", async (req, res, next) => {
            const resetToken = req.params.resetToken;
            const newPassword = req.body.newPassword;
            if (resetToken && newPassword) {
                const validUser = await user_1.userModel.findOne({ resetToken: resetToken }).exec();
                if (!validUser)
                    return next(new database_1.RequestError("Invalid or expired reset token."));
                // Reset the user's password and clear the reset token
                try {
                    await validUser.setSaltedPassword(newPassword);
                    validUser.resetToken = undefined;
                    await validUser.save();
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
                    user_1.userModel.findOneAndUpdate({ username: req.body.username }, req.body).then((doc) => {
                        if (doc) {
                            updateSession(req, res, doc?.disclose());
                            next({ success: true, data: req.session.user });
                        }
                    }).catch((error) => next(error));
                }
                else if (req.query.password != undefined) {
                    user_1.userModel.findOne({ username: req.body.username }, req.body).
                        then(async (doc) => {
                        await doc?.setSaltedPassword(req.body.password);
                        return doc;
                    }).
                        then((doc) => {
                        if (doc) {
                            updateSession(req, res, doc?.disclose());
                            next({ success: true, data: req.session.user });
                        }
                    }).catch((error) => next(error));
                }
            }
        });
        user.put("/:userId", async (req, res, next) => { });
        user.post("/verify/:verificationToken", async (req, res, next) => {
            if (!req.params.verificationToken)
                next(new database_1.RequestError("Verification token is required."));
            user_1.userModel.verify(req.params.verificationToken).
                then(user => {
                updateSession(req, res, user.disclose());
                next({ success: true, data: req.session.user });
            }).
                catch((err) => next(err));
        });
        user.post("/", async (req, res, next) => {
            if (req.query.login != undefined) {
                if (req.body.password) {
                    user_1.userModel.login(req.body.username, req.body.password).then(user => {
                        updateSession(req, res, user.disclose());
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
                    var user = new user_1.userModel(res, {
                        username: req.body.username,
                        fullname: req.body.fullname,
                        email: req.body.email,
                        singingPart: req.body.singingPart,
                    });
                    await user.setSaltedPassword(req.body.password).
                        then(user => user.save()).
                        then(user => next({
                        success: true,
                        user: user.disclose(),
                    }));
                }
            }
            // else if (req.query.resendVerification != undefined) {
            //   if (req.session['user'] && (req.session['user'] as any)._id) {
            //     let userId = (req.session['user'] as any)._id
            //     userModel.findById(userId)
            //     // TODO
            //   }
            // }
        });
        return user;
    }
    User.RouterFactory = RouterFactory;
})(User = exports.User || (exports.User = {}));
