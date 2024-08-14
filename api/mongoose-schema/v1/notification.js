"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationModel = exports.singular_name = exports.collection_name = exports.notificationSchema = void 0;
const email_1 = __importDefault(require("~/services/email"));
const mongoose_1 = require("mongoose");
const user_1 = require("./user");
exports.notificationSchema = new mongoose_1.Schema({
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: user_1.singular_name, required: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isMessageSent: { type: Boolean, required: true },
}, {
    methods: {
        async send() {
            return new Promise(async (resolve, reject) => {
                try {
                    await email_1.default.singleton.sendEmail(this.email, this.title, this.message);
                    this.isMessageSent = true;
                    await this.save();
                }
                catch (err) {
                    reject(err);
                }
                resolve();
            });
        },
    },
});
exports.collection_name = "notifications";
exports.singular_name = "Notification";
exports.notificationModel = (0, mongoose_1.model)(exports.singular_name, exports.notificationSchema, exports.collection_name);
