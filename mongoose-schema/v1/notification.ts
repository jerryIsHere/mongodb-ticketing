import EmailService from "~/services/email";
import { Schema, model, Types, Model, HydratedDocument } from "mongoose";
import { singular_name as User } from "./user";

export interface INotification {
  recipientId: Types.ObjectId;
  email: string;
  title: string;
  message: string;
  isMessageSent: boolean;
}
export interface INotificationMethod {
  send(): Promise<void>;
}
export interface NotificationModel
  extends Model<INotification, {}, INotificationMethod> {}
export const notificationSchema = new Schema<
  INotification,
  NotificationModel,
  INotificationMethod
>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: User, required: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isMessageSent: { type: Boolean, required: true },
  },
  {
    methods: {
      async send() {
        return new Promise<void>(async (resolve, reject) => {
          try {
            await EmailService.singleton.sendEmail(
              this.email,
              this.title,
              this.message
            );
            this.isMessageSent = true;
            await this.save();
          } catch (err) {
            reject(err);
          }
          resolve();
        });
      },
    },
  }
);
export const collection_name = "notifications";
export const singular_name = "Notification";
export const notificationModel = model<INotification, NotificationModel>(
  singular_name,
  notificationSchema,
  collection_name
);
