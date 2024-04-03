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
exports.UserDAO = void 0;
const database_1 = require("./database");
const dao_1 = require("./dao");
const bcrypt_1 = require("bcrypt");
const regex_1 = require("../../utils/regex");
class UserDAO extends dao_1.BaseDAO {
    get username() { return this._username; }
    set username(value) { this._username = value; }
    get saltedpassword() { return this._saltedpassword; }
    setPassword(value) {
        return new Promise((resolve, reject) => {
            (0, bcrypt_1.hash)(value, UserDAO.saltRounds, (err, hash) => {
                this._saltedpassword = hash;
                resolve(this);
            });
        });
    }
    get fullname() { return this._fullname; }
    set fullname(value) { this._fullname = value; }
    get email() { return this._email; }
    set email(value) {
        if (value && regex_1.REGEX.EMAIL.test(value)) {
            this._email = value;
        }
        else {
            dao_1.BaseDAO.RequestErrorList.push(new database_1.RequestError("User email is not in a valid format"));
        }
    }
    get singingPart() { return this._singingPart; }
    set singingPart(value) { this._singingPart = value; }
    get verified() { return this._verified; }
    set verified(value) { this._verified = value; }
    get resetToken() { return this._resetToken; }
    set resetToken(value) { this._resetToken = value; }
    get verificationToken() { return this._verificationToken; }
    set verificationToken(value) { this._verificationToken = value; }
    constructor(params) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        this._isAdmin = false;
        this.hasAdminRight = () => { return this._isAdmin; };
        this._verified = false;
        if (params.doc && params.doc._id) {
            this._username = params.doc.username;
            this._fullname = params.doc.fullname;
            this._email = params.doc.email;
            this._saltedpassword = params.doc.saltedpassword;
            this._singingPart = params.doc.singingPart;
            this._verified = params.doc.verified;
            this._verificationToken = params.doc.verificationToken;
            this._resetToken = params.doc.resetToken;
            if (params.doc.isAdmin)
                this._isAdmin = true;
        }
        else {
            this.username = params.username;
            this.fullname = params.fullname;
            this.email = params.email;
            this.singingPart = params.singingPart;
            this.verified = false;
            this.verificationToken = params.verificationToken;
            this.resetToken = params.resetToken;
        }
    }
    // static fetchAndDeserialize(id: string) {
    //     var _id = new ObjectId(id)
    //     Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: _id }).then((doc) => {
    //         if (doc && doc.username && doc.fullname && doc.email)
    //             return new UserDAO({ username: doc.username, fullname: doc.fullname, email: doc.email })
    //     })
    // }
    static fetchByUsernameAndDeserialize(username) {
        return __awaiter(this, void 0, void 0, function* () {
            var doc = yield database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ username: username });
            if (doc == null) {
                return null;
            }
            return new UserDAO({ doc: doc });
        });
    }
    static findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            var doc = yield database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ email: email });
            if (!doc)
                return null;
            return new UserDAO({ doc: doc });
        });
    }
    static findByResetToken(resetToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var doc = yield database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ resetToken: resetToken });
            if (!doc)
                return null;
            return new UserDAO({ doc: doc });
        });
    }
    static findByVerificationToken(verificationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var doc = yield database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ verificationToken: verificationToken });
            if (!doc)
                return null;
            return new UserDAO({ doc: doc });
        });
    }
    static login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var user = yield this.fetchByUsernameAndDeserialize(username);
                if (user == null) {
                    reject(new database_1.RequestError(`User with username ${username} not found.`));
                }
                else if (user.saltedpassword && (yield (0, bcrypt_1.compare)(password, user.saltedpassword))) {
                    resolve(user);
                }
                else {
                    reject(new database_1.RequestError("Incorrect password"));
                }
            }));
        });
    }
    withoutCredential() {
        this._saltedpassword = undefined;
        return this;
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.id)
                    reject(new database_1.RequestError(`Trying to create instantiated document ${this.id}`));
                database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ username: this.username }).then(instance => {
                    if (instance == null) {
                        database_1.Database.mongodb.collection(UserDAO.collection_name)
                            .insertOne(this.Serialize(true)).then((doc) => {
                            if (doc) {
                                this._id = doc.insertedId;
                                resolve(this);
                            }
                        });
                    }
                    else {
                        reject(new database_1.RequestError(`User with username ${this.username} already exists.`));
                    }
                });
            });
        });
    }
    update(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.Database.mongodb.collection(UserDAO.collection_name).updateOne({ _id: userData.id }, Object.assign({}, userData));
                if (!result.acknowledged || result.matchedCount === 0 || result.upsertedCount === 0)
                    throw new database_1.RequestError(`Update User Data (${this.username}) fail!`);
                return {
                    success: true,
                    data: userData
                };
            }
            catch (error) {
                console.error(error);
                throw new database_1.RequestError(`Update User Data (${this.username}) fail!`);
            }
        });
    }
}
exports.UserDAO = UserDAO;
UserDAO.collection_name = "users";
UserDAO.saltRounds = 10;
