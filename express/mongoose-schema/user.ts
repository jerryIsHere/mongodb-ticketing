import { hash, compare } from 'bcrypt'
import { REGEX } from "../../utils/regex";
import { generateResetToken } from "../../utils/token";
import EmailService from "../../services/email";
import { Schema, model, Types, Model } from 'mongoose';
const saltRounds = 10;
export type IDclosableUser = {
    username: string;
    fullname: string;
    email: string;
    singingPart?: string;
    verified: boolean;
    lastLoginDate?: Date;
    hasAdminRight: boolean;
    isCustomerSupport: boolean;
}
export interface IUser {
    username: string;
    fullname: string;
    email: string;
    singingPart?: string;
    saltedpassword: string;
    verified: boolean;
    resetToken?: string;
    lastLoginDate?: Date;
    _isAdmin: boolean;
    _isCustomerSupport: boolean;
}
export interface IUserMethod {
    discloseUser(): IDclosableUser
}
export interface UserModel extends Model<IUser, {}, IUserMethod> {

}
export const userSchema = new Schema<IUser, UserModel, IUserMethod>({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    singingPart: { type: String },
    saltedpassword: { type: String, required: true },
    verified: { type: Boolean, required: true },
    resetToken: { type: String },
    lastLoginDate: { type: Date },
    _isAdmin: { type: Boolean, required: true },
    _isCustomerSupport: { type: Boolean, required: true },

})
userSchema.methods.discloseUser = function () {
    return {
        username: this.username,
        fullname: this.fullname,
        email: this.email,
        singingPart: this.singingPart,
        verified: this.verified,
        lastLoginDate: this.lastLoginDate,
        hasAdminRight: this._isAdmin == true,
        isCustomerSupport: this._isCustomerSupport == true,
    }
}
export const collection_name = "users"
export const singular_name = "User"
export const userModel = model<IUser, UserModel>(singular_name, userSchema, collection_name)