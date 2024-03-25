
import { ObjectId, WithId, Document } from "mongodb";
import { Database, RequestError } from "./database";
import { BaseDAO } from "./dao";
import { EventDAO } from './event';
import { PriceTierDAO } from "./priceTier";
import { SeatDAO } from "./seat";
import { UserDAO } from "./user";


export class TicketDAO extends BaseDAO {
    public static readonly collection_name = "tickets"
    private _eventId: ObjectId | undefined
    public get eventId() { return this._eventId }
    public set eventId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new ObjectId(value) }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Event with id ${value} doesn't exists.`)
        //     }
        //     else {
        this._eventId = new ObjectId(value);
        //     }
        // })
    }

    private _seatId: ObjectId | undefined
    public get seatId() { return this._seatId }
    public set seatId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: new ObjectId(value) }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Seat with id ${value} doesn't exists.`)
        //     }
        //     else {
        this._seatId = new ObjectId(value);
        //     }
        // })
    }

    private _priceTierId: ObjectId | undefined
    public get priceTierId() { return this._priceTierId }
    public set priceTierId(value: ObjectId | string | undefined) {
        // return Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: new ObjectId(value) }).then(instance => {
        //     if (instance == null) {
        //         throw new RequestError(`Price tier with id ${value} doesn't exists.`)
        //     }
        //     else {
        this._priceTierId = new ObjectId(value);
        //     }
        // })
    }


    private _occupantId?: ObjectId | undefined | null
    public get occupantId(): ObjectId | undefined | null { return this._occupantId }
    public claim(userId: string): Promise<TicketDAO> {
        if (userId == null) { throw new RequestError(`Ticket must be claimed with an userId.`) }
        return new Promise((resolve, reject) => {
            Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: new ObjectId(userId) }).then(value => {
                if (value == null) throw new RequestError(`User with id ${userId} doesn't exists.`)
                if (this.id) {
                    Database.mongodb.collection(TicketDAO.collection_name)
                        .updateOne(
                            { _id: this.id, occupantId: null },
                            { $set: { "occupantId": userId } }
                        ).then((value) => {
                            if (value.matchedCount > 0) {
                                resolve(this)
                            }
                            else {
                                throw new RequestError(`Ticket not avaliable.`)
                            }
                        })
                }
                else {
                    throw new RequestError(`User with id ${userId} doesn't exists.`)
                }
            })
        })
    }
    constructor(
        params: { doc?: WithId<Document> }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
    }
    public Serialize(throwErrorWhenUndefined: boolean): Object {
        var obj = this.PropertiesWithGetter()
        if (throwErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined).filter(entry => entry[0] != "occupantId")
            if (undefinedEntries.length > 0)
                throw new RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`)
        }
        return obj
    }
    static aggregateQuery = (condition: Document, showOccupant: boolean) => {
        return [
            ...[
                condition,
                {
                    $lookup:
                    {
                        from: EventDAO.collection_name,
                        localField: "eventId",
                        foreignField: "_id",
                        as: "event",
                    }
                },
                {
                    $lookup:
                    {
                        from: SeatDAO.collection_name,
                        localField: "seatId",
                        foreignField: "_id",
                        as: "seat",
                    }
                },
                {
                    $lookup:
                    {
                        from: PriceTierDAO.collection_name,
                        localField: "priceTierId",
                        foreignField: "_id",
                        as: "priceTier",
                    }
                },
            ], ...showOccupant ? [
                {
                    $lookup:
                    {
                        from: UserDAO.collection_name,
                        localField: "occupantId",
                        foreignField: "_id",
                        as: "occupant",
                    }
                },
                { $set: { 'occupant': { $first: '$occupant' } } }
            ] :
                [
                    { $set: { 'occupied': { $cond: { if: { $ne: ["$occupantId", null] }, then: true, else: false } } } },
                    { $project: { occupantId: 0 } },
                ],
            ...[
                { $set: { 'event': { $first: '$event' } } },
                { $set: { 'seat': { $first: '$seat' } } },
                { $set: { 'priceTier': { $first: '$priceTier' } } },

            ]
        ]

    }
    static async listByEventId(evnetId: string, showOccupant: boolean) {
        return new Promise<TicketDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { eventId: new ObjectId(evnetId) } }, showOccupant))
            resolve((await cursor.toArray()).map(doc => new TicketDAO({ doc: { _id: doc._id, ...doc } })));
        })
    }
    static async ofUser(userId: string, showOccupant: boolean) {
        return new Promise<TicketDAO[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { occupantId: new ObjectId(userId) } }, showOccupant))
            resolve((await cursor.toArray()).map(doc => new TicketDAO({ doc: { _id: doc._id, ...doc } })));
        })
    }
    static async getWithDetailsById(id: string, showOccupant: boolean) {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { occupantId: new ObjectId(id) } }, showOccupant))
            var docs = await cursor.toArray()
            if (docs.length > 0) {
                var doc: WithId<Document> = { _id: new ObjectId(id), ...docs[0] }
                resolve(new this({ doc: doc }))
            } else {
                reject(new RequestError(`${this.name} has no instance with id ${id}.`))
            }
        })
    }
    static async getById(id: string) {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new ObjectId(id) })
            if (doc) {
                resolve(new TicketDAO({ doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }

    async create(): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            var result = await Database.mongodb.collection(TicketDAO.collection_name).insertOne(this.Serialize(true))
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
            }
        })
    }

    async delete(): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s DAO id is not initialized.`)); return }
            var result = await Database.mongodb.collection(TicketDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
            if (result.deletedCount > 0) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
            }

        })
    }

}
