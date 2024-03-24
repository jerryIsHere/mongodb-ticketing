import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { SeatDAO } from "./seat";
import { EventDAO } from "./event";

export class VenueDAO extends BaseDAO {
    public static readonly collection_name = "venues"
    private _venuename: string | undefined
    public get venuename() { return this._venuename }
    public set venuename(value: string | undefined) { this._venuename = value; }

    constructor(params: { venuename?: string } & { doc?: WithId<Document> }) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._venuename = params.doc.venuename
        }
        if (params.venuename)
            this.venuename = params.venuename
    }
    static async listAll() {
        var cursor = Database.mongodb.collection(VenueDAO.collection_name).find()
        return cursor.toArray();
    }
    static async getById(id: string) {
        var doc = await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new ObjectId(id) })
        if (doc) {
            return new VenueDAO({ doc: doc })
        }
        throw new RequestError(`${this.name} has no instance with id ${id}.`)
    }
    async create(): Promise<VenueDAO> {
        var result = await Database.mongodb.collection(VenueDAO.collection_name).insertOne(this.Serialize(true))
        if (result.insertedId) {
            return this
        }
        else {
            throw new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`)
        }
    }

    async update(): Promise<VenueDAO> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(VenueDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
        if (result.modifiedCount > 0) {
            return this
        }
        else {
            throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }

    }
    async checkDependency() {
        var seat = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ venueId: this._id })
        var event = await Database.mongodb.collection(EventDAO.collection_name).findOne({ venueId: this._id })
        return { seat: seat, event: event }
    }
    async delete(): Promise<VenueDAO> {
        return new Promise<VenueDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                var dependency = await this.checkDependency()
                if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
                if (dependency.event != null || dependency.seat != null) {
                    var dependencyType = dependency.event != null ? "event" : "seat"
                    var dependencyId = dependency.event != null ? dependency.event._id : dependency.seat?._id
                    throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed` +
                        `as ${dependencyType}  with id ${dependencyId} depends on it.`)
                }
                var result = await Database.mongodb.collection(VenueDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
                if (result.deletedCount > 0) {
                    Database.session.commitTransaction();
                    resolve(this)
                }
                else {
                    throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
                }
            })
        }).finally(() => {
            Database.session.endSession();
        })
    }
}
