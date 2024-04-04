import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { hash, compare } from 'bcrypt'
import { REGEX } from "../../utils/regex";

export class UserDAO extends BaseDAO {
    public static readonly collection_name = "users"
    public static readonly saltRounds = 10;
    private _isAdmin: boolean = false;
    public hasAdminRight: () => boolean = () => { return this._isAdmin };
    private _username: string | undefined
    public get username() { return this._username }
    public set username(value: string | undefined) { this._username = value; }

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

    private _email: string | undefined
    public get email() { return this._email }
    public set email(value: string | undefined) {
        if (value && REGEX.EMAIL.test(value)) {
            this._email = value;
        }
        else {
            BaseDAO.RequestErrorList.push(new RequestError("User email is not in a valid format"))
        }
    }

    private _singingPart?: string | undefined | null
    public get singingPart(): string | undefined | null { return this._singingPart }
    public set singingPart(value: string | undefined | null) { this._singingPart = value; }

    private _verified: boolean = false;
    public get verified(): boolean { return this._verified }
    public set verified(value: boolean) { this._verified = value; }

    private _resetToken?: string | undefined | null
    public get resetToken(): string | undefined | null { return this._resetToken }
    public set resetToken(value: string | undefined | null) { this._resetToken = value; }

    private _verificationToken?: string | undefined | null
    public get verificationToken(): string | undefined | null { return this._verificationToken }
    public set verificationToken(value: string | undefined | null) { this._verificationToken = value; }

    constructor(params:
        {
            username?: string;
            fullname?: string;
            email?: string;
            singingPart?: string | null;
            verified?: boolean;
            resetToken?: string | null;
            verificationToken?: string | null;
        } & {
            doc?: WithId<Document>
        }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._username = params.doc.username
            this._fullname = params.doc.fullname
            this._email = params.doc.email
            this._saltedpassword = params.doc.saltedpassword
            this._singingPart = params.doc.singingPart
            this._verified = params.doc.verified
            this._verificationToken = params.doc.verificationToken
            this._resetToken = params.doc.resetToken
            if (params.doc.isAdmin) this._isAdmin = true;
        }
        else {
            this.username = params.username
            this.fullname = params.fullname
            this.email = params.email
            this.singingPart = params.singingPart
            this.verified = false;
            this.verificationToken = params.verificationToken
            this.resetToken = params.resetToken
        }
    }
    // static fetchAndDeserialize(id: string) {
    //     var _id = new ObjectId(id)
    //     Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: _id }).then((doc) => {
    //         if (doc && doc.username && doc.fullname && doc.email)
    //             return new UserDAO({ username: doc.username, fullname: doc.fullname, email: doc.email })
    //     })
    // }

    public Serialize(pushErrorWhenUndefined: boolean): Object {
        var obj = this.PropertiesWithGetter()
        if (pushErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined).filter(entry => entry[0] != "verified" && entry[0] != "verificationToken" && entry[0] != "resetToken")
            if (undefinedEntries.length > 0)
                BaseDAO.RequestErrorList.push(new RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`))
        }
        return obj
    }
    static async fetchByUsernameAndDeserialize(username: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ username: username })

        if (doc == null) {
            return null
        }
        return new UserDAO({ doc: doc })
    }

    static async findByEmail(email: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ email: email })

        if (!doc)
            return null;
        return new UserDAO({ doc: doc });
    }

    static async findByResetToken(resetToken: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ resetToken: resetToken })

        if (!doc)
            return null;
        return new UserDAO({ doc: doc });
    }

    static async findByVerificationToken(verificationToken: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ verificationToken: verificationToken })

        if (!doc)
            return null;
        return new UserDAO({ doc: doc });
    }

    static async login(username: string, password: string): Promise<UserDAO> {
        return new Promise<UserDAO>(async (resolve, reject) => {
            var user = await this.fetchByUsernameAndDeserialize(username)
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

    public withoutCredential() {
        this._saltedpassword = undefined
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
            })
        })
    }

    public async update(userData: UserDAO) {
        try {
            const result = await Database.mongodb.collection(UserDAO.collection_name).updateOne({ _id: userData.id! }, {
                ...userData
            });
            if (!result.acknowledged || result.matchedCount === 0 || result.upsertedCount === 0) throw new RequestError(`Update User Data (${this.username}) fail!`)
            return {
                success: true,
                data: userData
            };
        } catch (error) {
            console.error(error);
            throw new RequestError(`Update User Data (${this.username}) fail!`)
        }
    }
}



