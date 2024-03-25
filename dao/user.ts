import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { hash, compare } from 'bcrypt'

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

        this._email = value;
    }

    private _singingPart?: string | undefined | null
    public get singingPart(): string | undefined | null { return this._singingPart }
    public set singingPart(value: string | undefined | null) { this._singingPart = value; }
    constructor(params:
        {
            username?: string;
            fullname?: string;
            email?: string;
            singingPart?: string | null;
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
            if (params.doc.isAdmin) this._isAdmin = true;
        }
        else {
            this.username = params.username
            this.fullname = params.fullname
            this.email = params.email
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
    static async fetchByUsernameAndDeserialize(username: string): Promise<UserDAO | null> {

        var doc = await Database.mongodb.collection(UserDAO.collection_name).findOne({ username: username })

        if (doc == null) {
            return null
        }
        return new UserDAO({ doc: doc })
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
}



