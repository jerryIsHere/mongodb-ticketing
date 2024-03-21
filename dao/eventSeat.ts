
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId, WithId, Document } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./api";
import { Event } from './event';
import { PriceTier } from "./priceTier";
import { Seat } from "./seat";
import { User } from "./user";

export namespace EventSeat {
    export const collection_name = "ticket"
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/", (req: Request, res: Response) => {
            if (req.query.eventId && typeof req.query.eventId == "string") {
                var cursor = Database.mongodb.collection(collection_name).find({ eventId: new ObjectId(req.query.eventId) })
                let result: Object[] = []
                cursor.forEach(doc => {
                    result.push(doc)
                }).then(_ => {
                    res.json({ success: true, data: result })
                })
            }
        })

        seat.post("/:ticketId", (req: Request, res: Response) => {
            return Database.mongodb.collection(collection_name).aggregate([
                { $match: { "_id": new ObjectId(req.params.ticketId) } },
                { $limit: 1 },
                {
                    $lookup:
                    {
                        from: Event.collection_name,
                        localField: "eventId",
                        foreignField: "_id",
                        as: "event",
                    }
                },
                {
                    $lookup:
                    {
                        from: Seat.collection_name,
                        localField: "seatId",
                        foreignField: "_id",
                        as: "seat",
                    }
                },
                {
                    $lookup:
                    {
                        from: PriceTier.collection_name,
                        localField: "priceTierId",
                        foreignField: "_id",
                        as: "priceTier",
                    }
                },
                { $set: { 'event': { $first: '$event' } } },
                { $set: { 'seat': { $first: '$seat' } } },
                { $set: { 'priceTier': { $first: '$priceTier' } } },
            ])
        })

        seat.patch("/:ticketId", (req: Request, res: Response) => {

        })

        seat.delete("/:ticketId", (req: Request, res: Response) => {

        })

        seat.put("/:ticketId", (req: Request, res: Response) => {

        })
        return seat
    };
    export class DAO extends BaseDAO {
        private _eventId: ObjectId | undefined
        public get eventId() { return this._eventId }
        public async setEventId(value: ObjectId | undefined) {
            return Database.mongodb.collection(Event.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._eventId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }

        private _seatId: ObjectId | undefined
        public get seatId() { return this._seatId }
        public async setSeatId(value: ObjectId | undefined) {
            return Database.mongodb.collection(Seat.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._seatId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }

        private _priceTierId: ObjectId | undefined
        public get priceTierId() { return this._priceTierId }
        public async setPriceTierId(value: ObjectId | undefined) {
            return Database.mongodb.collection(PriceTier.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Venue with id ${value} doesn't exists.`)
                }
                else {
                    this._priceTierId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }


        private _occupantId?: ObjectId | undefined | null
        public get occupantId(): ObjectId | undefined | null { return this._occupantId }
        public claim(userId: ObjectId): Promise<DAO> {
            if (userId != null) { throw new RequestError(`User with id ${userId} doesn't exists.`) }
            return new Promise((resolve, reject) => {
                Database.mongodb.collection(User.collection_name).findOne({ _id: userId }).then(instance => {
                    if (instance == null) throw new RequestError(`User with id ${userId} doesn't exists.`)
                    if (this.id) {
                        Database.mongodb.collection(collection_name)
                            .findOneAndUpdate(
                                { _id: this.id, occupantId: null },
                                { occupantId: userId },
                                { returnDocument: "after" }
                            ).then((doc) => {
                                if (doc && doc.value && doc.value.occupantId) {
                                    this._occupantId = doc.value.occupantId
                                    resolve(this)
                                }
                            })
                    }
                    else {
                        throw new RequestError(`User with id ${userId} doesn't exists.`)
                    }
                })
            })
        }
        private constructor(
            params: { doc?: WithId<Document> }
        ) {
            super(params.doc && params.doc._id ? params.doc._id : undefined);
        }
    }
}