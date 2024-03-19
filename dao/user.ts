import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database } from "./database";
import { hash, compare } from 'bcrypt'

export namespace User {
    export const collection_name = "users"
    const saltRounds = 10;
    export function RouterFactory(): Express.Router {
        var user = Router()

        user.get("/:userId", (req: Request, res: Response) => {

        })

        user.post("/:userId", (req: Request, res: Response) => {

        })

        user.patch("/:userId", (req: Request, res: Response) => {

        })

        user.delete("/:userId", (req: Request, res: Response) => {

        })

        user.put("/:userId", (req: Request, res: Response) => {

        })
        return user
    };
    export class DAO extends BaseDAO {
        private _username: string
        public get username() { return this._username }
        public set username(value: string) { this._username = value; Database.DirtyDAO.add(this); }

        private _saltedpassword?: string
        public get saltedpassword() { return this._saltedpassword }
        public set password(value: string) {
            hash(value, saltRounds, (err, hash) => {
                this._saltedpassword = hash; Database.DirtyDAO.add(this);
            });
        }

        private _fullname: string
        public get fullname() { return this._fullname }
        public set fullname(value: string) { this._fullname = value; Database.DirtyDAO.add(this); }

        private _email: string
        public get email() { return this._email }
        public set email(value: string) {

            this._email = value; Database.DirtyDAO.add(this);
        }

        private _singingPart?: string
        public get singingPart(): string | undefined { return this._singingPart }
        public set singingPart(value: string | undefined) { this._singingPart = value; Database.DirtyDAO.add(this); }
        private constructor(
            username: string,
            fullname: string,
            email: string,
            singingPart?: string,
        ) {
            super(collection_name);
            this._username = username
            this._fullname = fullname
            this._email = email
            this._singingPart = singingPart
        }
        static fetchAndParse(id: string) {
            var _id = new ObjectId(id)
            this.read(collection_name, _id).then((doc: ) => {
                if (doc && doc.username && doc.fullname && doc.email)
                    return new DAO(doc.username, doc.fullname, doc.email)
            })
        }
    }
}


