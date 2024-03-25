import { ObjectId, WithId, Document, } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";
import { TicketDAO } from "./ticket";



export class EventDAO extends BaseDAO {
    public static readonly collection_name = "events"
    private _eventname: string | undefined
    public get eventname() { return this._eventname }
    public set eventname(value: string | undefined) { this._eventname = value; }

    private _datetime: Date | undefined
    public get datetime() { return this._datetime }
    public set datetime(value: Date | undefined) { this._datetime = value; }

    private _duration: number | undefined
    public get duration() { return this._duration }
    public set duration(value: number | undefined) {
        if (value && value < 0) {
            throw new RequestError('Duration must be greater then 0.')
        }
        else {
            this._duration = value;
        }
    }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: value }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Venue with id ${value} doesn't exists.`)
        //     }
        //     else {

        this._venueId = new ObjectId(value);
        //     }
        // })
    }

    constructor(params: {
        eventname?: string,
        datetime?: Date,
        duration?: number,
    } & { doc?: WithId<Document> }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {


            this._eventname = params.doc.eventname
            this._datetime = params.doc.datetime
            this._duration = params.doc.duration
            this._venueId = params.doc.venueId
        }
        if (params.eventname)
            this.eventname = params.eventname

        if (params.datetime)
            this.datetime = params.datetime

        if (params.duration)
            this.duration = params.duration
    }
    static async listAll() {
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(EventDAO.collection_name).aggregate([
                {
                    $lookup:
                    {
                        from: VenueDAO.collection_name,
                        localField: "venueId",
                        foreignField: "_id",
                        as: "venue",
                    }
                },
                { $set: { 'venue': { $first: '$venue' } } }
            ])
            resolve((await cursor.toArray()));
        })
    }
    static async getById(id: string) {
        return new Promise<EventDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new EventDAO({ doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }
    async checkReference(): Promise<null | RequestError> {
        return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
            if (instance == null) {
                return new RequestError(`Venue with id ${this._venueId} doesn't exists.`)
            }
            else {
                return null
            }
        })
    }
    async create(): Promise<EventDAO> {
        return new Promise<EventDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                var referror = await this.checkReference()
                if (referror) {
                    reject(referror)
                    return
                }
                var result = await Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true))
                if (result.insertedId) {
                    Database.session.commitTransaction();
                    resolve(this)
                }
                else {
                    reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
                }
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }

    async update(): Promise<EventDAO> {
        return new Promise<EventDAO>(async (resolve, reject) => {
            if (this._id) {
                var result = await Database.mongodb.collection(EventDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
                if (result.modifiedCount > 0) {
                    return this
                }
                else {
                    reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
                }
            } else {
                reject(new RequestError(`${this.constructor.name}'s id is not initialized.`))
            }
        })

    }
    async checkTicketDependency() {
        var ticket = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: this._id })
        return ticket
    }
    async delete(): Promise<EventDAO> {
        return new Promise<EventDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                var dependency = await this.checkTicketDependency()
                if (dependency != null) {
                    return reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                        `as ticket with id ${dependency._id} depends on it.`))
                }
                if (this._id) {
                    var result = await Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
                    if (result.deletedCount > 0) {
                        Database.session.commitTransaction();
                        resolve(this)
                    }
                }
                else { return reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)) }
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }
}


