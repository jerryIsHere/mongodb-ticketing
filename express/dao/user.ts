import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { hash, compare } from 'bcrypt'
import { REGEX } from "../../utils/regex";
import { Response } from "express";
import { generateResetToken } from "../../utils/token";
import EmailService from "../../services/email";

export class UserDAO extends BaseDAO {
    public static readonly collection_name = "users"
    public static readonly saltRounds = 10;
    private _isAdmin: boolean = false;
    public hasAdminRight: () => boolean = () => { return this._isAdmin };
    private _username: string | undefined
    public get username() { return this._username }
    public set username(value: string | undefined) {
        if (this._username == undefined) {
            this._username = value;
        }
        else {
            this.res.locals.RequestErrorList.push(new RequestError("username is immutable"))
        }
    }

    private _saltedpassword?: string
    public get saltedpassword() { return this._saltedpassword }
    public setPassword(value: string): Promise<UserDAO> {
        return new Promise((resolve, reject) => {
            hash(value, UserDAO.saltRounds, (err, hash) => {
                this._saltedpassword = hash;
                resolve(this);
            });

        })
    }

    private _fullname: string | undefined
    public get fullname() { return this._fullname }
    public set fullname(value: string | undefined) { this._fullname = value; }

    private _emailModified: boolean = false;
    private _email: string | undefined
    public get email() { return this._email }
    public set email(value: string | undefined) {
        if (value && REGEX.EMAIL.test(value)) {
            if (this._email != undefined && this.email != value) {
                this._verified = false;
                this._emailModified = true;
            }
            this._email = value;
        }
        else {
            this.res.locals.RequestErrorList.push(new RequestError("User email is not in a valid format"))
        }
    }

    private _singingPart?: string | undefined | null
    public get singingPart(): string | undefined | null { return this._singingPart }
    public set singingPart(value: string | undefined | null) { this._singingPart = value; }

    private _verified: boolean = false;
    public get verified(): boolean { return this._verified }

    private _resetToken?: string | undefined | null = null
    public get resetToken(): string | undefined | null { return this._resetToken }
    public set resetToken(value: string | undefined | null) { this._resetToken = value; }

    private _verificationToken?: string | undefined | null = null
    public get verificationToken(): string | undefined | null { return this._verificationToken }
    public set verificationToken(value: string | undefined | null) { this._verificationToken = value; }

    constructor(
        res: Response, params:
            {
                username?: string;
                fullname?: string;
                email?: string;
                singingPart?: string | null;
            } & {
                doc?: WithId<Document>
            }
    ) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._username = params.doc.username
            this._fullname = params.doc.fullname
            this._email = params.doc.email
            this._saltedpassword = params.doc.saltedpassword
            this._singingPart = params.doc.singingPart
            this._verified = params.doc.verified ? true : false
            this._verificationToken = params.doc.verificationToken
            this._resetToken = params.doc.resetToken
            if (params.doc.isAdmin) this._isAdmin = true;
        }
        else {
            if (params.username)
                this.username = params.username
            if (params.fullname)
                this.fullname = params.fullname
            if (params.email)
                this.email = params.email
            if (params.singingPart)
                this.singingPart = params.singingPart
        }
    }
    // static fetchAndDeserialize(id: string) {
    //     var _id = new ObjectId(id)
    //     Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: _id }).then((doc) => {
    //         if (doc && doc.username && doc.fullname && doc.email)
    //             return new UserDAO({ username: doc.username, fullname: doc.fullname, email: doc.email })
    //     })
    // }

    static async fetchByUsernameAndDeserialize(
        res: Response, username: string): Promise<UserDAO> {

        return new Promise<UserDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ username: username })

            if (doc == null) {
                reject(new RequestError(`User with user name ${username} not found.`))
            }
            else {
                resolve(new UserDAO(res, { doc: doc }))
            }
        })
    }
    static async getById(
        res: Response, id: string) {
        return new Promise<UserDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: new ObjectId(id) }, { session: res.locals.session })
            if (doc) {
                resolve(new UserDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }

    public Hydrated(params: { withCredentials?: boolean } = {}): Object {
        if (params.withCredentials == false) this.clearCredential()
        var obj = this.PropertiesWithGetter()
        obj = { _id: this._id, ...obj }
        return obj
    }
    static async findByEmail(
        res: Response, email: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ email: email })

        if (!doc)
            return null;
        return new UserDAO(res, { doc: doc });
    }

    static async findByResetToken(
        res: Response, resetToken: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ resetToken: resetToken })

        if (!doc)
            return null;
        return new UserDAO(res, { doc: doc });
    }

    static async findByVerificationToken(
        res: Response, verificationToken: string): Promise<UserDAO> {
        return new Promise<UserDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ verificationToken: verificationToken })
            if (!doc) {
                reject(new RequestError("User with specified verification token not found."));
            } else {
                resolve(new UserDAO(res, { doc: doc }));
            }
        })
    }

    static VerifyWithToken(res: Response, verificationToken: string) {
        return UserDAO.findByVerificationToken(res, verificationToken).then(dao => {
            dao._verified = true;
            dao.verificationToken = null;
            return dao.update()
        })
    }

    static async login(
        res: Response, username: string, password: string): Promise<UserDAO> {
        return new Promise<UserDAO>(async (resolve, reject) => {
            var user = await this.fetchByUsernameAndDeserialize(
                res, username)
            if (user == null) {
                reject(new RequestError(`User with username ${username} not found.`))
            }
            else if (user.saltedpassword && await compare(password, user.saltedpassword)) {
                resolve(user)
            }
            else {
                reject(new RequestError("Incorrect password"))
            }
        })
    }

    public async sendActivationEmail(): Promise<UserDAO> {
        return new Promise<UserDAO>(async (resolve, reject) => {
            if (this.email) {
                try {
                    if (this.verificationToken == null || this.verificationToken == undefined) {
                        const token = await generateResetToken();
                        this.verificationToken = token;
                        await this.update()
                    }
                    await EmailService.singleton.emailVerification(this.email, this.verificationToken);
                }
                catch (err) {
                    reject(err)
                }
                resolve(this)
            }
            else {
                if (this.email == undefined) reject(`Email of user ${this.username} is not initialized`)
            }
        })
    }

    public async sendResetPasswordEmail(): Promise<UserDAO> {
        return new Promise<UserDAO>(async (resolve, reject) => {
            if (this.email) {
                try {
                    if (this.resetToken == null || this.resetToken == undefined) {
                        const token = await generateResetToken();
                        this.resetToken = token;
                        await this.update()
                    }
                    EmailService.singleton.resetPasswordEmail(this.email, this.resetToken);
                }
                catch (err) {
                    reject(err)
                }
                resolve(this)
            }
            else {
                if (this.email == undefined) reject(`Email of user ${this.username} is not initialized`)
            }
        })
    }

    static credentialsProperty = ["_saltedpassword", "_resetToken", "_verificationToken"]
    public clearCredential() {
        this._saltedpassword = undefined
        this._resetToken = undefined
        this._verificationToken = undefined
        return this
    }

    public async create(): Promise<UserDAO> {
        return new Promise<UserDAO>((resolve, reject) => {
            if (this.id)
                reject(new RequestError(`Trying to create instantiated document ${this.id}`))
            Database.mongodb.collection(UserDAO.collection_name).findOne({ username: this.username }).then(instance => {
                if (instance == null) {
                    Database.mongodb.collection(UserDAO.collection_name)
                        .insertOne(
                            this.Serialize(true)
                        ).then((doc) => {
                            if (doc) {
                                this._id = doc.insertedId
                                resolve(this)
                            }
                        })
                }
                else {
                    reject(new RequestError(`User with username ${this.username} already exists.`))
                }
            }).then((_) => {
                this.sendActivationEmail()
                return this
            })
        })
    }

    public async update() {
        return new Promise<UserDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
            var result = await Database.mongodb.collection(UserDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
            if (result.modifiedCount > 0) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
            }
        }).then(async (_) => {
            if (this._emailModified) {
                const token = await generateResetToken();
                this.verificationToken = token;
                this.sendActivationEmail()
            }
            return this
        })
    }
}



