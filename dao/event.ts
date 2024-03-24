import { ObjectId, WithId, Document, } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";


export class EventDAO extends BaseDAO {
    public static readonly collection_name = "events"
    private _eventname: string | undefined
    public get eventname() { return this._eventname }
    public set eventname(value: string | undefined) { this._eventname = value; BaseDAO.DirtyList.add(this); }

    private _datetime: Date | undefined
    public get datetime() { return this._datetime }
    public set datetime(value: Date | undefined) { this._datetime = value; BaseDAO.DirtyList.add(this); }

    private _duration: number | undefined
    public get duration() { return this._duration }
    public set duration(value: number | undefined) {
        if (value && value < 0) {
            throw new RequestError('Duration must be greater then 0.')
        }
        else {
            this._duration = value; BaseDAO.DirtyList.add(this);
        }
    }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public async setVenueId(value: ObjectId | undefined): Promise<EventDAO> {
        return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: value }).then(instance => {
            if (instance == null) {
                throw new RequestError(`Venue with id ${value} doesn't exists.`)
            }
            else {
                this._venueId = value; BaseDAO.DirtyList.add(this); return this
            }
        })
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
        return cursor.toArray();
    }
    static async getById(id: string) {
        var doc = await Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new ObjectId(id) })
        if (doc) {
            return new EventDAO({ doc: doc })
        }
        throw new RequestError(`${this.name} has no instance with id ${id}.`)
    }

    async create(): Promise<EventDAO> {
        var result = await Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true))
        if (result.insertedId) {
            return this
        }
        else {
            throw new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`)
        }
    }

    async update(): Promise<EventDAO> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(EventDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
        if (result.modifiedCount > 0) {
            return this
        }
        else {
            throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }

    }

    async delete(): Promise<null> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
        if (result.deletedCount > 0) {
            return null
        }
        else {
            throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }
    }
}


