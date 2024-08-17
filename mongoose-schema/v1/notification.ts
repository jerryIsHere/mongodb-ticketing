import EmailService from "../../services/email";
import { Schema, model, Types, Model, HydratedDocument } from "mongoose";
import { names } from "../schema-names";

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
    recipientId: { type: Schema.Types.ObjectId, ref: names.User.singular_name, required: true },
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
notificationSchema.virtual('recipient', {
  ref: names.User.singular_name,
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true
})
notificationSchema.pre('updateOne', { document: false, query: true }, () => {
  throw new Error(
    "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
export const notificationModel = model<INotification, NotificationModel>(
  names.Notification.singular_name,
  notificationSchema,
  names.Notification.collection_name
);
