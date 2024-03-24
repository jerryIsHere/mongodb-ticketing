import { MongoClient, ObjectId, WithId, Document, InsertOneResult } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";


export class SeatDAO extends BaseDAO {
    public static readonly collection_name = "seats"
    private _row: string | undefined
    public get row() { return this._row }
    public set row(value: string | undefined) { this._row = value; }

    private _no: number | undefined
    public get no() { return this._no }
    public set no(value: number | undefined) { this._no = value; }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: new ObjectId(value) }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Venue with id ${value} doesn't exists.`)
        //     }
        //     else {
        this._venueId = new ObjectId(value);
        //     }
        // })
    }
    constructor(params: {
        row?: string,
        no?: number,
    } & { doc?: WithId<Document> }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._row = params.doc.row
            this._no = params.doc.no
            this._venueId = params.doc.venueId
        }
        if (params.row)
            this.row = params.row

        if (params.no)
            this.no = params.no
    }
    static async listByVenueId(venueId: string) {
        var cursor = Database.mongodb.collection(SeatDAO.collection_name).find({ venueId: new ObjectId(venueId) })
        return cursor.toArray();
    } static async getById(id: string) {
        var doc = await Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new ObjectId(id) })
        if (doc) {
            return new SeatDAO({ doc: doc })
        }
        throw new RequestError(`${this.name} has no instance with id ${id}.`)
    }
    async checkReference() {
        await Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: this._venueId }).then(instance => {
            if (instance == null) {
                throw new RequestError(`Venue with id ${this._venueId} doesn't exists.`)
            }
        })
    }
    async create(): Promise<SeatDAO> {
        return new Promise<SeatDAO>((resolve, reject) => {
            Database.session.withTransaction(async () => {
                await this.checkReference()
                var result = await Database.mongodb.collection(SeatDAO.collection_name).insertOne(this.Serialize(true))
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

    async update(): Promise<SeatDAO> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(SeatDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
        if (result.modifiedCount > 0) {
            return this
        }
        else {
            throw new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }

    }

    async delete(): Promise<null> {
        if (this._id == undefined) throw new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)
        var result = await Database.mongodb.collection(SeatDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
        if (result.deletedCount > 0) {
            return null
        }
        else {
            throw new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`)
        }
    }
}
