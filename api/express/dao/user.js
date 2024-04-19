"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDAO = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const dao_1 = require("./dao");
const bcrypt_1 = require("bcrypt");
const regex_1 = require("../../utils/regex");
const token_1 = require("../../utils/token");
const email_1 = __importDefault(require("../../services/email"));
class UserDAO extends dao_1.BaseDAO {
    static collection_name = "users";
    static saltRounds = 10;
    _isAdmin = false;
    hasAdminRight = () => { return this._isAdmin; };
    _username;
    get username() { return this._username; }
    set username(value) {
        if (this._username == undefined) {
            this._username = value;
        }
        else {
            this.res.locals.RequestErrorList.push(new database_1.RequestError("username is immutable"));
        }
    }
    _saltedpassword;
    get saltedpassword() { return this._saltedpassword; }
    setPassword(value) {
        return new Promise((resolve, reject) => {
            (0, bcrypt_1.hash)(value, UserDAO.saltRounds, (err, hash) => {
                this._saltedpassword = hash;
                resolve(this);
            });
        });
    }
    _fullname;
    get fullname() { return this._fullname; }
    set fullname(value) { this._fullname = value; }
    _emailModified = false;
    _email;
    get email() { return this._email; }
    set email(value) {
        if (value && regex_1.REGEX.EMAIL.test(value)) {
            if (this._email != undefined && this.email != value) {
                this._verified = false;
                this._emailModified = true;
            }
            this._email = value;
        }
        else {
            this.res.locals.RequestErrorList.push(new database_1.RequestError("User email is not in a valid format"));
        }
    }
    _singingPart = "";
    get singingPart() { return this._singingPart; }
    set singingPart(value) { this._singingPart = value; }
    _verified = false;
    get verified() { return this._verified; }
    _resetToken = null;
    get resetToken() { return this._resetToken; }
    set resetToken(value) { this._resetToken = value; }
    _verificationToken = null;
    get verificationToken() { return this._verificationToken; }
    set verificationToken(value) { this._verificationToken = value; }
    _lastLoginDate;
    get lastLoginDate() { return this._lastLoginDate; }
    set lastLoginDate(value) {
        if (typeof value == "string") {
            if (value = "$$NOW") {
                this._lastLoginDate = value;
            }
            else {
                try {
                    this._lastLoginDate = new Date(value);
                }
                catch (err) {
                    this.res.locals.RequestErrorList.push(new database_1.RequestError("Cannot parse lastLoginDate parameter of event request"));
                }
            }
        }
        else if (value instanceof Date) {
            this._lastLoginDate = value;
        }
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._username = params.doc.username;
            this._fullname = params.doc.fullname;
            this._email = params.doc.email;
            this._saltedpassword = params.doc.saltedpassword;
            this._singingPart = params.doc.singingPart;
            this._verified = params.doc.verified ? true : false;
            this._verificationToken = params.doc.verificationToken;
            this._resetToken = params.doc.resetToken;
            if (params.doc.isAdmin)
                this._isAdmin = true;
        }
        else {
            if (params.username)
                this.username = params.username;
            if (params.fullname)
                this.fullname = params.fullname;
            if (params.email)
                this.email = params.email;
            if (params.singingPart)
                this.singingPart = params.singingPart;
        }
    }
    // static fetchAndDeserialize(id: string) {
    //     var _id = new ObjectId(id)
    //     Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: _id }).then((doc) => {
    //         if (doc && doc.username && doc.fullname && doc.email)
    //             return new UserDAO({ username: doc.username, fullname: doc.fullname, email: doc.email })
    //     })
    // }
    static async fetchByUsernameAndDeserialize(res, username) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ username: username });
            if (doc == null) {
                reject(new database_1.RequestError(`User with user name ${username} not found.`));
            }
            else {
                resolve(new UserDAO(res, { doc: doc }));
            }
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: new mongodb_1.ObjectId(id) }, { session: res.locals.session });
            if (doc) {
                resolve(new UserDAO(res, { doc: doc }));
            }
            reject(new database_1.RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    Hydrated(params = {}) {
        if (params.withCredentials == false)
            this.clearCredential();
        var obj = this.PropertiesWithGetter();
        obj = { _id: this._id, ...obj };
        return obj;
    }
    static async listAll(res) {
        return new Promise(async (resolve, reject) => {
            var cursor = database_1.Database.mongodb.collection(UserDAO.collection_name).find();
            resolve((await cursor.toArray()).map(doc => new UserDAO(res, { doc: doc })));
        });
    }
    static async findByEmail(res, email) {
        var doc = await database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ email: email });
        if (!doc)
            return null;
        return new UserDAO(res, { doc: doc });
    }
    static async findByResetToken(res, resetToken) {
        var doc = await database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ resetToken: resetToken });
        if (!doc)
            return null;
        return new UserDAO(res, { doc: doc });
    }
    static async findByVerificationToken(res, verificationToken) {
        return new Promise(async (resolve, reject) => {
            var doc = await database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ verificationToken: verificationToken });
            if (!doc) {
                reject(new database_1.RequestError("User with specified verification token not found."));
            }
            else {
                resolve(new UserDAO(res, { doc: doc }));
            }
        });
    }
    static VerifyWithToken(res, verificationToken) {
        return UserDAO.findByVerificationToken(res, verificationToken).then(dao => {
            dao._verified = true;
            dao.verificationToken = null;
            return dao.update();
        });
    }
    static async login(res, username, password) {
        return new Promise(async (resolve, reject) => {
            var user = await this.fetchByUsernameAndDeserialize(res, username);
            if (user == null) {
                reject(new database_1.RequestError(`User with username ${username} not found.`));
            }
            else if (user.saltedpassword && await (0, bcrypt_1.compare)(password, user.saltedpassword)) {
                user.lastLoginDate = "$$NOW";
                resolve(user.update());
            }
            else {
                reject(new database_1.RequestError("Incorrect password"));
            }
        });
    }
    async sendActivationEmail() {
        return new Promise(async (resolve, reject) => {
            return null;
            // if (this.email) {
            //     try {
            //         if (this.verificationToken == null || this.verificationToken == undefined) {
            //             const token = await generateResetToken();
            //             this.verificationToken = token;
            //             await this.update()
            //         }
            //         await EmailService.singleton.emailVerification(this.email, this.verificationToken);
            //     }
            //     catch (err) {
            //         reject(err)
            //     }
            //     resolve(this)
            // }
            // else {
            //     if (this.email == undefined) reject(`Email of user ${this.username} is not initialized`)
            // }
        });
    }
    async sendResetPasswordEmail() {
        return new Promise(async (resolve, reject) => {
            if (this.email) {
                try {
                    if (this.resetToken == null || this.resetToken == undefined) {
                        const token = await (0, token_1.generateResetToken)();
                        this.resetToken = token;
                        await this.update();
                    }
                    email_1.default.singleton.resetPasswordEmail(this.email, this.resetToken);
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
    }
    static credentialsProperty = ["_saltedpassword", "_resetToken", "_verificationToken"];
    clearCredential() {
        this._saltedpassword = undefined;
        this._resetToken = undefined;
        this._verificationToken = undefined;
        return this;
    }
    async create() {
        return new Promise((resolve, reject) => {
            if (this.id)
                reject(new database_1.RequestError(`Trying to create instantiated document ${this.id}`));
            database_1.Database.mongodb.collection(UserDAO.collection_name).findOne({ username: this.username }).then(async (instance) => {
                if (instance == null) {
                    return await database_1.Database.mongodb.collection(UserDAO.collection_name)
                        .insertOne(this.Serialize(true));
                }
                else {
                    reject(new database_1.RequestError(`User with username ${this.username} already exists.`));
                }
            }).then((doc) => {
                if (doc) {
                    this._id = doc.insertedId;
                    resolve(this);
                }
            }).then((_) => {
                this.sendActivationEmail();
                return this;
            });
        });
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id == undefined) {
                reject(new database_1.RequestError(`${this.constructor.name}'s id is not initialized.`));
                return;
            }
            console.log(this.Serialize(true));
            var result = await database_1.Database.mongodb.collection(UserDAO.collection_name).updateOne({ _id: new mongodb_1.ObjectId(this._id) }, { $set: this.Serialize(true) });
            if (result.modifiedCount > 0) {
                resolve(this);
            }
            else {
                reject(new database_1.RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
            }
        }).then(async (_) => {
            if (this._emailModified) {
                const token = await (0, token_1.generateResetToken)();
                this.verificationToken = token;
                this.sendActivationEmail();
            }
            return this;
        });
    }
}
exports.UserDAO = UserDAO;
