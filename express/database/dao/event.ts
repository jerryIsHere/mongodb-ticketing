import { ObjectId, WithId, Document, } from "mongodb";
import { Database, RequestError } from "~/express/database/database";
import { BaseDAO } from "./dao";
import { VenueDAO } from "./venue";
import { TicketDAO } from "./ticket";
import { SeatDAO } from "./seat";
import { Response } from "express";



export class EventDAO extends BaseDAO {
    public static readonly collection_name = "events"
    private _eventname: string | undefined
    public get eventname() { return this._eventname }
    public set eventname(value: string | undefined) { this._eventname = value; }

    private _datetime: Date | undefined
    public get datetime() { return this._datetime }
    public set datetime(value: Date | string | undefined) {
        if (typeof value == "string") {
            try {
                this._datetime = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new RequestError("Cannot parse datetime parameter of event request"))
            }
        }
        else if (value instanceof Date) {
            this._datetime = value;
        }
    }

    private _startFirstRoundSellDate: Date | undefined
    public get startFirstRoundSellDate() { return this._startFirstRoundSellDate }
    public set startFirstRoundSellDate(value: Date | string | undefined) {
        if (typeof value == "string") {
            try {
                this._startFirstRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new RequestError("Cannot parse startFirstRoundSellDate parameter of event request"))
            }
        }
        else if (value instanceof Date) {
            this._startFirstRoundSellDate = value;
        }
    }
    private _endFirstRoundSellDate: Date | undefined
    public get endFirstRoundSellDate() { return this._endFirstRoundSellDate }
    public set endFirstRoundSellDate(value: Date | string | undefined) {
        if (typeof value == "string") {
            try {
                this._endFirstRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new RequestError("Cannot parse endFirstRoundSellDate parameter of event request"))
            }
        }
        else if (value instanceof Date) {
            this._endFirstRoundSellDate = value;
        }
    }
    private _startSecondRoundSellDate: Date | undefined
    public get startSecondRoundSellDate() { return this._startSecondRoundSellDate }
    public set startSecondRoundSellDate(value: Date | string | undefined) {
        if (typeof value == "string") {
            try {
                this._startSecondRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new RequestError("Cannot parse startSecondRoundSellDate parameter of event request"))
            }
        }
        else if (value instanceof Date) {
            this._startSecondRoundSellDate = value;
        }
    }
    private _endSecondRoundSellDate: Date | undefined
    public get endSecondRoundSellDate() { return this._endSecondRoundSellDate }
    public set endSecondRoundSellDate(value: Date | string | undefined) {
        if (typeof value == "string") {
            try {
                this._endSecondRoundSellDate = new Date(value);
            }
            catch (err) {
                this.res.locals.RequestErrorList.push(new RequestError("Cannot parse endSecondRoundSellDate parameter of event request"))
            }
        }
        else if (value instanceof Date) {
            this._endSecondRoundSellDate = value;
        }
    }
    private _duration: number | undefined
    public get duration() { return this._duration }
    public set duration(value: number | undefined) {
        if (value && value < 0) {
            this.res.locals.RequestErrorList.push(new RequestError('Duration must be greater than 0.'))
        }
        else {
            this._duration = value;
        }
    }

    private _shoppingCartSize: number | undefined
    public get shoppingCartSize() { return this._shoppingCartSize }
    public set shoppingCartSize(value: number | undefined) {
        this._shoppingCartSize = value;
    }
    private _firstRoundTicketQuota: number | undefined
    public get firstRoundTicketQuota() { return this._firstRoundTicketQuota }
    public set firstRoundTicketQuota(value: number | undefined) {
        this._firstRoundTicketQuota = value;
    }
    private _secondRoundTicketQuota: number | undefined
    public get secondRoundTicketQuota() { return this._secondRoundTicketQuota }
    public set secondRoundTicketQuota(value: number | undefined) {
        this._secondRoundTicketQuota = value;
    }

    private _venueId: ObjectId | undefined
    public get venueId() { return this._venueId }
    public set venueId(value: ObjectId | string | undefined) {
        this._venueId = new ObjectId(value);
    }

    constructor(
        res: Response, params: {
            eventname?: string,
            datetime?: Date,
            startFirstRoundSellDate?: Date,
            endFirstRoundSellDate?: Date,
            startSecondRoundSellDate?: Date,
            endSecondRoundSellDate?: Date,
            duration?: number,
            shoppingCartSize?: number,
            firstRoundTicketQuota?: number,
            secondRoundTicketQuota?: number,

        } & { doc?: WithId<Document> }
    ) {
        super(res, params.doc && params.doc._id ? params.doc._id : undefined);
        if (params.doc && params.doc._id) {


            this._eventname = params.doc.eventname
            this._datetime = params.doc.datetime
            this._startFirstRoundSellDate = params.doc.startFirstRoundSellDate
            this._endFirstRoundSellDate = params.doc.endFirstRoundSellDate
            this._startSecondRoundSellDate = params.doc.startSecondRoundSellDate
            this._endSecondRoundSellDate = params.doc.endSecondRoundSellDate
            this._shoppingCartSize = params.doc.shoppingCartSize
            this._firstRoundTicketQuota = params.doc.firstRoundTicketQuota
            this._secondRoundTicketQuota = params.doc.secondRoundTicketQuota
            this._duration = params.doc.duration
            this._venueId = params.doc.venueId
        }
        if (params.eventname)
            this.eventname = params.eventname

        if (params.datetime)
            this.datetime = params.datetime


        if (params.startFirstRoundSellDate)
            this.startFirstRoundSellDate = params.startFirstRoundSellDate
        if (params.endFirstRoundSellDate)
            this.endFirstRoundSellDate = params.endFirstRoundSellDate
        if (params.startSecondRoundSellDate)
            this.startSecondRoundSellDate = params.startSecondRoundSellDate
        if (params.endSecondRoundSellDate)
            this.endSecondRoundSellDate = params.endSecondRoundSellDate
        if (params.shoppingCartSize)
            this.shoppingCartSize = params.shoppingCartSize
        if (params.firstRoundTicketQuota)
            this.firstRoundTicketQuota = params.firstRoundTicketQuota
        if (params.secondRoundTicketQuota)
            this.secondRoundTicketQuota = params.secondRoundTicketQuota

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
    static async listSelling() {
        return new Promise<Document[]>(async (resolve, reject) => {
            var cursor = Database.mongodb.collection(EventDAO.collection_name).aggregate([
                {
                    $match: {
                        $or: [
                            {
                                $and: [
                                    { startFirstRoundSellDate: { $lte: new Date() } },
                                    { endFirstRoundSellDate: { $gte: new Date() } },
                                ]
                            },
                            {
                                $and: [
                                    { startSecondRoundSellDate: { $lte: new Date() } },
                                    { endSecondRoundSellDate: { $gte: new Date() } },
                                ]
                            },
                        ]
                    }
                },
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
    static async getById(
        res: Response, id: string) {
        return new Promise<EventDAO>(async (resolve, reject) => {
            var doc = await Database.mongodb.collection(EventDAO.collection_name).findOne({ _id: new ObjectId(id) }, { session: res.locals.session })
            if (doc) {
                resolve(new EventDAO(res, { doc: doc }))
            }
            reject(new RequestError(`${this.name} has no instance with id ${id}.`))
        })
    }
    async checkReference(): Promise<null | RequestError> {
        return Database.mongodb.collection(VenueDAO.collection_name).findOne({ _id: this._venueId }, { session: this.res.locals.session }).then(instance => {
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
            this.res.locals.session.startTransaction()
            var referror = await this.checkReference()
            if (referror) {
                reject(referror)
                return
            }
            var result = await Database.mongodb.collection(EventDAO.collection_name).insertOne(this.Serialize(true), { session: this.res.locals.session })
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
            ], { session: this.res.locals.session })).next()
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
                var result = await Database.mongodb.collection(EventDAO.collection_name).updateOne({ _id: new ObjectId(this._id) }, { $set: this.Serialize(true) }, { session: this.res.locals.session })
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
    async checkTicketDependency() {
        if (this._id) {
            return await Database.mongodb.collection(TicketDAO.collection_name).findOne({ eventId: new ObjectId(this._id) }, { session: this.res.locals.session })
        }
        return
    }
    async delete(): Promise<EventDAO> {
        return new Promise<EventDAO>(async (resolve, reject) => {
            this.res.locals.session.startTransaction()
            var dependency = await this.checkTicketDependency()
            if (dependency) {
                reject(new RequestError(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
                    `as ticket with id ${dependency._id} depends on it.`)); return
            }
            if (this._id) {
                var result = await Database.mongodb.collection(EventDAO.collection_name).deleteOne({ _id: new ObjectId(this._id) }, { session: this.res.locals.session })
                if (result.deletedCount > 0) {

                    resolve(this)
                }
            }
            else { reject(new RequestError(`${this.constructor.name}'s id is not initialized.`)); return }
        })
    }
}


