import { hash, compare } from "bcrypt";
import { REGEX } from "~/utils/regex";
import { generateResetToken } from "~/utils/token";
import EmailService from "~/services/email";
import { Schema, model, Types, Model, HydratedDocument } from "mongoose";
const saltRounds = 10;
export type IDisclosableUser = {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  singingPart?: string;
  verified: boolean;
  lastLoginDate?: Date;
  hasAdminRight: boolean;
  isCustomerSupport: boolean;
};
export interface IUser {
  username: string;
  fullname: string;
  email: string;
  singingPart?: string;
  saltedpassword: string;
  verified: boolean;
  verificationToken?: string;
  resetToken?: string;
  lastLoginDate?: Date;
  _isAdmin: boolean;
  _isCustomerSupport: boolean;
}
export interface IUserMethod {
  disclose(): IDisclosableUser;
  sendResetPasswordEmail(): Promise<HydratedUser>;
  setSaltedPassword(password: string): Promise<HydratedUser>;
}
interface HydratedUser extends HydratedDocument<IUser, IUserMethod> { }
export interface UserModel extends Model<IUser, {}, IUserMethod> {
  verify(verificationToken: string): Promise<HydratedUser>;
  login(username: string, password: string): Promise<HydratedUser>;
}
export const userSchema = new Schema<IUser, UserModel, IUserMethod>(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      validate: {
        validator(val: string) {
          return REGEX.EMAIL.test(val);
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
  },
  {
    methods: {
      setSaltedPassword(password: string) {
        return new Promise<HydratedUser>((resolve, reject) =>
          hash(password, saltRounds, async (err, hash) => {
            this.saltedpassword = hash;
            await this.save();
            resolve(this);
          })
        );
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
                const token = await generateResetToken();
                this.resetToken = token;
                await this.save();
              }
              EmailService.singleton.resetPasswordEmail(
                this.username,
                this.email,
                this.resetToken
              );
            } catch (err) {
              reject(err);
            }
            resolve(this);
          } else {
            if (this.email == undefined)
              reject(`Email of user ${this.username} is not initialized`);
          }
        });
      },
    },
  }
);
userSchema.static("verify", async function verify(verificationToken: string) {
  let user = await userModel
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
userSchema.static(
  "verify",
  async function login(username: string, password: string) {
    let user = await userModel.findOne({ username: username });
    if (user) {
      if (await compare(password, user.saltedpassword)) {
        user.lastLoginDate = new Date();
        await user.save();
        return user;
      }
      throw new Error(`Incorrect password.`);
    }
    throw new Error(`User with user name ${username} not found.`);
  }
);
userSchema.path("email").validate(async function (val) {
  const token = await generateResetToken();
  this.verificationToken = token;
  //currently disabled as we don't allow user to change email in front end?
  //this.sendActivationEmail()

});
export const collection_name = "users";
export const singular_name = "User";
export const userModel = model<IUser, UserModel>(
  singular_name,
  userSchema,
  collection_name
);
