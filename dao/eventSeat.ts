
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

        seat.get("/:ticketId", (req: Request, res: Response) => {

        })

        seat.post("/:ticketId", (req: Request, res: Response) => {

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
        public set eventId(value: ObjectId | undefined) {
            Database.mongodb.collection(Event.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Event with id ${value} doesn't exists.`)
                }
                else {
                    this._eventId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }

        private _seatId: ObjectId | undefined
        public get seatId() { return this._seatId }
        public set seatId(value: ObjectId | undefined) {
            Database.mongodb.collection(Seat.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Seat with id ${value} doesn't exists.`)
                }
                else {
                    this._seatId = value; BaseDAO.DirtyList.add(this);
                }
            })
        }

        private _priceTierId: ObjectId | undefined
        public get priceTierId() { return this._priceTierId }
        public set priceTierId(value: ObjectId | undefined) {
            Database.mongodb.collection(PriceTier.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Price tier with id ${value} doesn't exists.`)
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
            eventId: ObjectId,
            seatId: ObjectId,
            priceTierId: ObjectId,
            occupantId: ObjectId
        ) {
            super();;
            this.eventId = eventId
            this.seatId = seatId
            this.priceTierId = priceTierId
            this._occupantId = occupantId
        }
    }
}