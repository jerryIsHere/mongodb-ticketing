import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId, WithId, Document, InsertOneResult } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";
import { hash, compare } from 'bcrypt'
declare module "express-session" {
    interface SessionData {
        user: User.DAO | null;
    }
}

export namespace User {
    export const collection_name = "users"
    const saltRounds = 10;
    export function RouterFactory(): Express.Router {
        var user = Router()

        user.patch("/:userId", (req: Request, res: Response) => {

        })


        user.put("/:userId", (req: Request, res: Response) => {

        })
        user.post("/", async (req: Request, res: Response) => {
            if (req.query.login != undefined) {
                if (req.body.password) {
                    DAO.login(req.body.username, req.body.password).then(user => {
                        if (user) {
                            req.session['user'] = user.withoutCredential()
                            res.cookie("user", JSON.stringify({ ...user.withoutCredential().Serialize(false), hasAdminRight: user.hasAdminRight() }))
                            res.json({ success: true, message: user.withoutCredential().Serialize(false) })
                        }
                        else {
                            res.json({ success: false, })
                        }
                    }).catch(reason => {
                        res.json({ success: false, message: typeof reason === "string" ? reason : reason instanceof RequestError ? reason.message : null })
                    })

                }
                else {
                    throw new RequestError("A login must be done with a password.")
                }
            }
            else if (req.query.logout != undefined) {
                req.session['user'] = null;
                res.clearCookie("user");
                res.json({ success: true })
            }
            else if (req.query.register != undefined) {

                if (req.body.username && req.body.fullname && req.body.email && req.body.password) {
                    var dao = new DAO({
                        username: req.body.username,
                        fullname: req.body.fullname,
                        email: req.body.email,
                        singingPart: req.body.singingPart
                    })
                    dao.setPassword(req.body.password).then(() => {
                        dao.create().then((dao) => {
                            if (dao.id) {
                                req.session['user'] = dao.withoutCredential()
                                res.cookie("user", JSON.stringify(dao.withoutCredential().Serialize(false)))
                                res.json({ success: true, user: dao.withoutCredential().Serialize(false) })
                            }
                        }).catch((reason) => {
                            res.json({ success: false, message: typeof reason === "string" ? reason : reason instanceof RequestError ? reason.message : null })
                        })
                    })

                }
            }

        })
        return user
    };
    export class DAO extends BaseDAO {
        private _isAdmin: boolean = false;
        public hasAdminRight: () => boolean = () => { return this._isAdmin };
        private _username: string | undefined
        public get username() { return this._username }
        public set username(value: string | undefined) { this._username = value; BaseDAO.DirtyList.add(this); }

        private _saltedpassword?: string
        public get saltedpassword() { return this._saltedpassword }
        public setPassword(value: string): Promise<void> {
            return new Promise((resolve, reject) => {
                hash(value, saltRounds, (err, hash) => {
                    this._saltedpassword = hash; BaseDAO.DirtyList.add(this);
                    resolve();
                });
            })
        }

        private _fullname: string | undefined
        public get fullname() { return this._fullname }
        public set fullname(value: string | undefined) { this._fullname = value; BaseDAO.DirtyList.add(this); }

        private _email: string | undefined
        public get email() { return this._email }
        public set email(value: string | undefined) {

            this._email = value; BaseDAO.DirtyList.add(this);
        }

        private _singingPart?: string | undefined | null
        public get singingPart(): string | undefined | null { return this._singingPart }
        public set singingPart(value: string | undefined | null) { this._singingPart = value; BaseDAO.DirtyList.add(this); }
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
        static fetchAndDeserialize(id: string) {
            var _id = new ObjectId(id)
            this.read(collection_name, _id).then((doc) => {
                if (doc && doc.username && doc.fullname && doc.email)
                    return new DAO({ username: doc.username, fullname: doc.fullname, email: doc.email })
            })
        }
        static async fetchByUsernameAndDeserialize(username: string): Promise<DAO> {
            var doc = await Database.mongodb.collection(collection_name).findOne({ username: username })

            if (doc == null) {
                throw new RequestError(`User with username ${username} not found.`)
            }
            return new DAO({ doc: doc })
        }

        static async login(username: string, password: string): Promise<DAO | null> {
            var user = await this.fetchByUsernameAndDeserialize(username)
            if (user.saltedpassword && await compare(password, user.saltedpassword)) {
                return user
            }
            else {
                throw new RequestError("Incorrect password");
            }
        }

        public withoutCredential() {
            this._saltedpassword = undefined
            return this
        }



        public async create(): Promise<DAO> {
            if (this.id)
                throw Error(`Trying to create instantiated document ${this.id}`)
            return new Promise((resolve, reject) => {
                Database.mongodb.collection(User.collection_name).findOne({ username: this.username }).then(instance => {
                    if (instance == null) {
                        Database.mongodb.collection(collection_name)
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
                        reject(`User with username ${this.username} with exists.`)
                    }
                })
            })
        }
    }
}


