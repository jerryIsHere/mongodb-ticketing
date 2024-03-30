
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
        this._eventId = new ObjectId(value);
    }

    private _seatId: ObjectId | undefined
    public get seatId() { return this._seatId }
    public set seatId(value: ObjectId | string | undefined) {
        this._seatId = new ObjectId(value);
    }

    private _priceTierId: ObjectId | undefined
    public get priceTierId() { return this._priceTierId }
    public set priceTierId(value: ObjectId | string | undefined) {
        this._priceTierId = new ObjectId(value);
    }
    private _paid: Boolean | null | undefined
    public get paid() { return this._paid }
    public set paid(value: Boolean | null | undefined) {
        this._paid = value;
    }

    private _paymentRemark: String | null | undefined
    public get paymentRemark() { return this._paymentRemark }
    public set paymentRemark(value: String | null | undefined) {
        this._paymentRemark = value;
    }




    private _occupantId?: ObjectId | undefined | null
    public get occupantId(): ObjectId | undefined | null { return this._occupantId }
    public void() {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            Database.session.startTransaction()
            this._occupantId = null
            try {
                await this.checkReference()
            }
            catch (err) {
                reject(err)
                return
            }
            if (this.id) {
                Database.mongodb.collection(TicketDAO.collection_name)
                    .updateOne(
                        { _id: this.id, occupantId: null },
                        { $set: { "occupantId": null, paid: null, paymentRemark: null } }
                    ).then((value) => {
                        if (value.modifiedCount > 0) {
                            resolve(this)
                        }
                        else {
                            reject(new RequestError(`Ticket with id ${this.id}  not avaliable.`))
                            return
                        }
                    })
            }
        })
    }
    public claim(userId: string): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            Database.session.startTransaction()
            this._occupantId = new ObjectId(userId)
            try {
                await this.checkReference()
            }
            catch (err) {
                reject(err)
                return
            }
            if (this.id) {
                Database.mongodb.collection(TicketDAO.collection_name)
                    .updateOne(
                        { _id: this.id, occupantId: null },
                        { $set: { "occupantId": userId } }
                    ).then((value) => {
                        if (value.modifiedCount > 0) {
                            resolve(this)
                        }
                        else {
                            reject(new RequestError(`Ticket with id ${this.id}  not avaliable.`))
                            return
                        }
                    })
            }
            else {
                reject(new RequestError(`${this.constructor.name} with id ${userId} doesn't exists.`))
                return
            }
        })
    }
    constructor(
        params: { paid?: boolean, paymentRemark?: string } & { doc?: WithId<Document> }
    ) {
        super(params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {
            this._eventId = params.doc.eventId
            this._seatId = params.doc.seatId
            this._occupantId = params.doc.occupantId
            this._priceTierId = params.doc.priceTierId
            this._paid = params.doc.paid
            this._paymentRemark = params.doc.paymentRemark
        }
        if (params.paid)
            this.paid = params.paid
        if (params.paymentRemark)
            this.paymentRemark = params.paymentRemark
    }
    public Serialize(pushErrorWhenUndefined: boolean): Object {
        var obj = this.PropertiesWithGetter()
        if (pushErrorWhenUndefined) {
            var undefinedEntries = Object.entries(obj).filter(e => e[1] === undefined).filter(entry => entry[0] != "occupantId" && entry[0] != "paid" && entry[0] != "paymentRemark")
            if (undefinedEntries.length > 0)
                BaseDAO.RequestErrorList.push(new RequestError(`Undefined entries: ${undefinedEntries.map(e => e[0]).join(", ")}`))
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
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { eventId: new ObjectId(evnetId) } }, showOccupant))
            resolve((await cursor.toArray()));
        })
    }
    static async listSold(showOccupant: boolean) {
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { occupantId: { $ne: null } } }, showOccupant))
            resolve((await cursor.toArray()));
        })
    }
    static async ofUser(userId: string, showOccupant: boolean) {
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { occupantId: new ObjectId(userId) } }, showOccupant))
            resolve((await cursor.toArray()));
        })
    }
    static async getWithDetailsById(id: string, showOccupant: boolean) {
        return new Promise<Document>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(TicketDAO.collection_name).
                aggregate(this.aggregateQuery({ $match: { occupantId: new ObjectId(id) } }, showOccupant))
            var docs = await cursor.toArray()
            if (docs.length > 0) {
                resolve(docs[0])
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
    static async getByIds(ids: string[]): Promise<TicketDAO[]> {
        return new Promise<TicketDAO[]>(async (resolve, reject) => {
            Promise.all(
                ids.map(async id =>
                    new Promise<TicketDAO>(async (daoresolve, daoreject) => {
                        var doc = await Database.mongodb.collection(TicketDAO.collection_name).findOne({ _id: new ObjectId(id) })
                        if (doc) {
                            daoresolve(new TicketDAO({ doc: doc }))
                        }
                        daoreject(new RequestError(`${this.name} has no instance with id ${id}.`))
                    }))
            ).then(daos => {
                resolve(daos)
            })
        })
    }
    async checkReference() {
        var eventdoc = await Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: this._eventId })
        if (eventdoc) {
            let venueId = eventdoc.venueId
            await Database.mongodb.collection(PriceTierDAO.collection_name).findOne({ _id: this._priceTierId }).then(instance => {
                if (instance == null) {
                    BaseDAO.RequestErrorList.push(new RequestError(`Price Tier with id ${this._priceTierId} doesn't exists.`))
                }
            })
            await Database.mongodb.collection(SeatDAO.collection_name).findOne({ _id: this._seatId, venueId: venueId }).then(instance => {
                if (instance == null) {
                    BaseDAO.RequestErrorList.push(new RequestError(`Seat with id ${this._seatId} in the same event venue with id ${venueId} doesn't exists.`))
                }
            })
            if (this._occupantId)
                await Database.mongodb.collection(UserDAO.collection_name).findOne({ _id: this._occupantId }).then(instance => {
                    if (instance == null) {
                        BaseDAO.RequestErrorList.push(new RequestError(`User with id ${this._seatId} doesn't exists.`))
                    }
                })
        }
        else {
            BaseDAO.RequestErrorList.push(new RequestError(`Event with id ${this._eventId} doesn't exists.`))
            return null
        }
    }
    async duplicationChecking() {
        await Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: this.eventId, seatId: this.seatId }).then(instance => {
            if (instance) {
                BaseDAO.RequestErrorList.push(new RequestError(`Ticket with same event with id ${this.eventId} and seat with id ${this.seatId} already exists.`))
            }
        })
    }
    async create(): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            Database.session.startTransaction()
            try {
                await this.checkReference()
                await this.duplicationChecking()
            }
            catch (err) {
                reject(err)
                return
            }
            var result = await Database.mongodb.collection(TicketDAO.collection_name).insertOne(this.Serialize(true))
            if (result.insertedId) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Creation of ${this.constructor.name} failed with unknown reason.`))
            }
        })
    }
    static async batchCreate(daos: TicketDAO[]): Promise<TicketDAO[]> {
        return new Promise<TicketDAO[]>((resolve, reject) => {
            Database.session.startTransaction()
            Promise.all(daos.map(dao =>
                new Promise<TicketDAO>(async (daoresolve, daoreject) => {
                    try {
                        await dao.checkReference()
                        await dao.duplicationChecking()
                    }
                    catch (err) {
                        daoreject(err)
                        return
                    }
                    var result = await Database.mongodb.collection(TicketDAO.collection_name).insertOne(dao.Serialize(true))
                    if (result.insertedId) {
                        daoresolve(dao)
                    }
                    else {
                        daoreject(new RequestError(`Creation of ${dao.constructor.name} failed with unknown reason.`))
                    }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
    static async batchUdatePriceTier(daos: TicketDAO[], priceTierId: string): Promise<TicketDAO[]> {
        return new Promise<TicketDAO[]>((resolve, reject) => {
            Database.session.startTransaction()
            Promise.all(daos.map(dao =>
                new Promise<TicketDAO>(async (daoresolve, daoreject) => {
                    try {
                        dao.priceTierId = new ObjectId(priceTierId)
                        await dao.checkReference()
                    }
                    catch (err) {
                        daoreject(err)
                        return
                    }
                    if (dao._id) {
                        var result = await Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: dao._id }, { $set: dao.Serialize(true) })
                        if (result) {
                            daoresolve(dao)
                        }
                        else {
                            daoreject(new RequestError(`Update of ${dao.constructor.name} failed with unknown reason.`))
                        }
                    }
                    else {
                        reject(new RequestError(`One of the ticket's id is not initialized.`))
                    }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
    async update(): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
            try {
                await this.checkReference()
            }
            catch (err) {
                reject(err)
                return
            }
            var result = await Database.mongodb.collection(TicketDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) })
            if (result.modifiedCount > 0) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Update of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
            }

        })

    }
    static async batchClaim(daos: TicketDAO[], userId: string): Promise<TicketDAO[]> {
        return new Promise<TicketDAO[]>((resolve, reject) => {
            Database.session.startTransaction()
            Promise.all(daos.map(dao =>
                new Promise<TicketDAO>(async (daoresolve, daoreject) => {
                    dao._occupantId = new ObjectId(userId)
                    try {
                        await dao.checkReference()
                    }
                    catch (err) {
                        daoreject(err)
                        return
                    }
                    if (dao.id) {
                        var result = await Database.mongodb.collection(TicketDAO.collection_name).updateOne(
                            { _id: dao.id, occupantId: null },
                            { $set: { "occupantId": userId } })
                        if (result.modifiedCount > 0) {
                            daoresolve(dao)
                        }
                        else {
                            daoreject(new RequestError(`Ticket with id ${dao.id} is not avaliable.`))
                        }
                    }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
    async delete(): Promise<TicketDAO> {
        return new Promise<TicketDAO>(async (resolve, reject) => {
            if (this._id == undefined) { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
            var result = await Database.mongodb.collection(TicketDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) })
            if (result.deletedCount > 0) {
                resolve(this)
            }
            else {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed with unknown reason.`))
            }

        })
    }
    static async batchDelete(daos: TicketDAO[]): Promise<TicketDAO[]> {
        return new Promise<TicketDAO[]>((resolve, reject) => {
            Database.session.startTransaction()
            Promise.all(daos.filter(dao => dao.id != undefined).map(dao =>
                new Promise<TicketDAO>(async (daoresolve, daoreject) => {
                    if (dao.occupantId != null) {
                        daoreject(new RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed as it has occupant.`))
                    }
                    var result = await Database.mongodb.collection(TicketDAO.collection_name).deleteOne(dao.Serialize(true))
                    if (result.deletedCount > 0) {
                        daoresolve(dao)
                    }
                    else {
                        daoreject(new RequestError(`Deletation of ${dao.constructor.name} with id ${dao.id} failed with unknown reason.`))
                    }
                })
            )).then(daos => {
                resolve(daos)
            })
        })
    }
}
