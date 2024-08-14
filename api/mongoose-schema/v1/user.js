"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.singular_name = exports.collection_name = exports.userSchema = void 0;
const bcrypt_1 = require("bcrypt");
const regex_1 = require("~/utils/regex");
const token_1 = require("~/utils/token");
const email_1 = __importDefault(require("~/services/email"));
const mongoose_1 = require("mongoose");
const saltRounds = 10;
exports.userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: {
        type: String,
        required: true,
        validate: {
            validator(val) {
                return regex_1.REGEX.EMAIL.test(val);
            },
            message: "User email is not in a valid format.",
        },
    },
    singingPart: { type: String },
    saltedpassword: { type: String, required: true },
    verified: { type: Boolean, required: true },
    verificationToken: { type: String },
    resetToken: { type: String },
    lastLoginDate: { type: Date },
    _isAdmin: { type: Boolean, required: true },
    _isCustomerSupport: { type: Boolean, required: true },
}, {
    methods: {
        setSaltedPassword(password) {
            return new Promise((resolve, reject) => (0, bcrypt_1.hash)(password, saltRounds, async (err, hash) => {
                this.saltedpassword = hash;
                await this.save();
                resolve(this);
            }));
        },
        disclose() {
            return {
                _id: this._id.toString(),
                username: this.username,
                fullname: this.fullname,
                email: this.email,
                singingPart: this.singingPart,
                verified: this.verified,
                lastLoginDate: this.lastLoginDate,
                hasAdminRight: this._isAdmin == true,
                isCustomerSupport: this._isCustomerSupport == true,
            };
        },
        sendResetPasswordEmail() {
            return new Promise(async (resolve, reject) => {
                if (this.email && this.username) {
                    try {
                        if (this.resetToken == null || this.resetToken == undefined) {
                            const token = await (0, token_1.generateResetToken)();
                            this.resetToken = token;
                            await this.save();
                        }
                        email_1.default.singleton.resetPasswordEmail(this.username, this.email, this.resetToken);
                    }
                    catch (err) {
                        reject(err);
                    }
                    resolve(this);
                }
                else {
                    if (this.email == undefined)
                        reject(`Email of user ${this.username} is not initialized`);
                }
            });
        },
    },
});
exports.userSchema.static("verify", async function verify(verificationToken) {
    let user = await exports.userModel
        .findOne({ verificationToken: verificationToken })
        .then();
    if (user) {
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();
        return user;
    }
    throw new Error("User with this verification token not found.");
});
exports.userSchema.static("verify", async function login(username, password) {
    let user = await exports.userModel.findOne({ username: username });
    if (user) {
        if (await (0, bcrypt_1.compare)(password, user.saltedpassword)) {
            user.lastLoginDate = new Date();
            await user.save();
            return user;
        }
        throw new Error(`Incorrect password.`);
    }
    throw new Error(`User with user name ${username} not found.`);
});
exports.userSchema.path("email").validate(async function (val) {
    const token = await (0, token_1.generateResetToken)();
    this.verificationToken = token;
    //currently disabled as we don't allow user to change email in front end?
    //this.sendActivationEmail()
});
exports.collection_name = "users";
exports.singular_name = "User";
exports.userModel = (0, mongoose_1.model)(exports.singular_name, exports.userSchema, exports.collection_name);
