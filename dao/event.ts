import { ObjectId, WithId, Document, } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";
import { TicketDAO } from "./ticket";
import { SeatDAO } from "./seat";



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
            BaseDAO.RequestErrorList.push(new RequestError('Duration must be greater then 0.'))
        }
        else {
            this._duration = value;
        }
    }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        this._venueId = new ObjectId(value);
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
        return new Promise<EventDAO>(async (resolve, reject) => {
            Database.session.startTransaction()
            var referror = await this.checkReference()
            if (referror) {
                reject(referror)
                return
            }
            var result = await Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true))
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
            }
        })
    }
    async checkTicketVenueDependency() {
        if (this._id) {
            return (await Database.mongodb.collection(TicketDAO.collection_name).aggregate([
                { $match: { eventId: new ObjectId(this._id) } },
                {
                    $lookup:
                    {
                        from: SeatDAO.collection_name,
                        localField: "seatId",
                        foreignField: "_id",
                        as: "seat",
                    }
                },
                { $set: { 'seat': { $first: '$seat' } } },
                { $match: { 'seat.venueId': { $ne: new ObjectId(this.venueId) } } },
            ])).next()
        }
        return
    }
    async update(): Promise<EventDAO> {
        return new Promise<EventDAO>(async (resolve, reject) => {
            var dependency = await this.checkTicketVenueDependency()
            if (dependency != null) {
                reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on another venue ${dependency.seat.venueId}.`)); return
            }
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
        if (this._id) {
            return await Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: new ObjectId(this._id) })
        }
        return
    }
    async delete(): Promise<EventDAO> {
        return new Promise<EventDAO>(async (resolve, reject) => {
            Database.session.startTransaction()
            var dependency = await this.checkTicketDependency()
            if (dependency) {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`)); return
            }
            if (this._id) {
                var result = await Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
                if (result.deletedCount > 0) {

                    resolve(this)
                }
            }
            else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
        })
    }
}


