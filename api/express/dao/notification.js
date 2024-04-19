import { ObjectId } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { UserDAO } from "./user";
import EmailService from "../../services/email";
export class NotificationDAO extends BaseDAO {
    static collection_name = "notifications";
    _recipientId;
    get recipientId() { return this._recipientId; }
    set recipientId(value) {
        this._recipientId = new ObjectId(value);
    }
    _email;
    get email() { return this._email; }
    set email(value) {
        this._email = value;
    }
    _title;
    get title() { return this._title; }
    set title(value) {
        this._title = value;
    }
    _message;
    get message() { return this._message; }
    set message(value) {
        this._message = value;
    }
    _isMessageSent = false;
    get isMessageSent() { return this._isMessageSent; }
    set isMessageSent(value) {
        this._isMessageSent = value;
    }
    constructor(res, params) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._message = params.doc.message;
            this._title = params.doc.title;
            this._email = params.doc.email;
            this._recipientId = params.doc.recipientId;
            this._isMessageSent = params.doc.isMessageSent;
        }
        else {
            if (params.message)
                this.message = params.message;
            if (params.recipientId)
                this.recipientId = params.recipientId;
            if (params.title)
                this.title = params.title;
            if (params.email)
                this.email = params.email;
        }
    }
    static async listAll() {
        return new Promise(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(NotificationDAO.collection_name).aggregate([
                {
                    $lookup: {
                        from: UserDAO.collection_name,
                        localField: "recipientId",
                        foreignField: "_id",
                        as: "recipient",
                    }
                },
                { $set: { 'recipient': { $first: '$recipient' } } }
            ]);
            resolve((await cursor.toArray()));
        });
    }
    static async getById(res, id) {
        return new Promise(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(NotificationDAO.collection_name).findOne({ _id: new ObjectId(id) });
            if (doc) {
                resolve(new NotificationDAO(res, { doc: doc }));
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`));
        });
    }
    async create() {
        return new Promise((resolve, reject) => {
            Database.mongodb.collection(NotificationDAO.collection_name)
                .insertOne(this.Serialize(true)).then((doc) => {
                if (doc) {
                    this._id = doc.insertedId;
                    resolve(this);
                }
            });
        });
    }
    async update() {
        return new Promise(async (resolve, reject) => {
            if (this._id) {
                var result = await Database.mongodb.collection(NotificationDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) });
                if (result.modifiedCount > 0) {
                    resolve(this);
                }
                else {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`));
                }
            }
            else {
                reject(new RequestError(`${this.constructor.name}'s id is not initialized.`));
            }
        });
    }
    async send() {
        return new Promise(async (resolve, reject) => {
            if (this.email && this.title && this.message) {
                try {
                    await EmailService.singleton.sendEmail(this.email, this.title, this.message);
                }
                catch (err) {
                    reject(err);
                }
                this.isMessageSent = true;
                this.update();
                resolve(this);
            }
            else {
                if (this.email == undefined)
                    reject(`Recipent's email of notification ${this._id} is not initialized`);
                if (this.title == undefined)
                    reject(`Title of notification ${this._id} is not initialized`);
                if (this.message == undefined)
                    reject(`Message of notification ${this._id} is not initialized`);
            }
        });
    }
}
