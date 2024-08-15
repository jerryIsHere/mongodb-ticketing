import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "../../database/database";
import { BaseDAO } from "./dao";
import { UserDAO } from "./user";
import { Response } from "express";
import EmailService from "../../../services/email";

export class NotificationDAO extends BaseDAO {
    public static readonly collection_name = "notifications"
    private _recipientId?: ObjectId | undefined
    public get recipientId(): ObjectId | undefined { return this._recipientId }
    public set recipientId(value: ObjectId | string | undefined) {
        this._recipientId = new ObjectId(value);
    }
    private _email?: string | undefined
    public get email(): string | undefined { return this._email }
    public set email(value: string | undefined) {
        this._email = value;
    }

    private _title?: string | undefined
    public get title(): string | undefined { return this._title }
    public set title(value: string | undefined) {
        this._title = value;
    }

    private _message?: string | undefined
    public get message(): string | undefined { return this._message }
    public set message(value: string | undefined) {
        this._message = value;
    }

    private _isMessageSent?: boolean | undefined = false
    public get isMessageSent(): boolean | undefined { return this._isMessageSent }
    public set isMessageSent(value: boolean | undefined) {
        this._isMessageSent = value;
    }

    constructor(
        res: Response, params:
            {
                message?: string;
                title?: string;
                email?:string
                recipientId?: string | ObjectId | null;
            } & {
                doc?: WithId<Document>
            }
    ) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._message = params.doc.message
            this._title = params.doc.title
            this._email = params.doc.email
            this._recipientId = params.doc.recipientId
            this._isMessageSent = params.doc.isMessageSent
        }
        else {
            if (params.message)
                this.message = params.message
            if (params.recipientId)
                this.recipientId = params.recipientId
            if (params.title)
                this.title = params.title
            if (params.email)
                this.email = params.email
        }
    }
    static async listAll() {
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(NotificationDAO.collection_name).aggregate([
                {
                    $lookup:
                    {
                        from: UserDAO.collection_name,
                        localField: "recipientId",
                        foreignField: "_id",
                        as: "recipient",
                    }
                },
                { $set: { 'recipient': { $first: '$recipient' } } }
            ])
            resolve((await cursor.toArray()));
        })
    }

    static async getById(
        res: Response, id: string) {
        return new Promise<NotificationDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(NotificationDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new NotificationDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }
    public async create(): Promise<NotificationDAO> {
        return new Promise<NotificationDAO>((resolve, reject) => {
            Database.mongodb.collection(NotificationDAO.collection_name)
                .insertOne(
                    this.Serialize(true)
                ).then((doc) => {
                    if (doc) {
                        this._id = doc.insertedId
                        resolve(this)
                    }
                })
        })
    }
    async update(): Promise<NotificationDAO> {
        return new Promise<NotificationDAO>(async (resolve, reject) => {
            if (this._id) {
                var result = await Database.mongodb.collection(NotificationDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
                if (result.modifiedCount > 0) {
                    resolve(this)
                }
                else {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
                }
            } else {
                reject(new RequestError(`${this.constructor.name}'s id is not initialized.`))
            }
        })
    }


    public async send(): Promise<NotificationDAO> {
        return new Promise<NotificationDAO>(async (resolve, reject) => {
            if (this.email && this.title && this.message) {
                try {
                    await EmailService.singleton.sendEmail(this.email, this.title, this.message);
                }
                catch (err) {
                    reject(err)
                }
                this.isMessageSent = true;
                this.update()
                resolve(this)
            }
            else {
                if (this.email == undefined) reject(`Recipent's email of notification ${this._id} is not initialized`)
                if (this.title == undefined) reject(`Title of notification ${this._id} is not initialized`)
                if (this.message == undefined) reject(`Message of notification ${this._id} is not initialized`)
            }
        })
    }

}
