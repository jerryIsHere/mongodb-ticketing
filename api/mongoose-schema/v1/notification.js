"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationModel = exports.notificationSchema = void 0;
const email_1 = __importDefault(require("../../services/email"));
const mongoose_1 = require("mongoose");
const schema_names_1 = require("../schema-names");
exports.notificationSchema = new mongoose_1.Schema({
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: schema_names_1.names.User.singular_name, required: true },
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
exports.notificationSchema.pre('updateOne', { document: false, query: true }, () => {
    throw new Error("Please use find(ById) and chain save afterwards, as referential checking needs documents");
});
exports.notificationModel = (0, mongoose_1.model)(schema_names_1.names.Notification.singular_name, exports.notificationSchema, schema_names_1.names.Notification.collection_name);
