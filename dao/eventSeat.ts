
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { MongoClient, ObjectId } from "mongodb";
import { Config } from "./config";
import { BaseDAO, Database, RequestError } from "./database";
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
        private _eventId: ObjectId
        public get eventId() { return this._eventId }
        public set eventId(value: ObjectId) {
            Database.mongodb.collection(Event.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Event with id ${value} doesn't exists.`)
                }
                else {
                    this._eventId = value; Database.DirtyDAO.add(this);
                }
            })
        }

        private _seatId: ObjectId
        public get seatId() { return this._seatId }
        public set seatId(value: ObjectId) {
            Database.mongodb.collection(Seat.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Seat with id ${value} doesn't exists.`)
                }
                else {
                    this._seatId = value; Database.DirtyDAO.add(this);
                }
            })
        }

        private _priceTierId: ObjectId
        public get priceTierId() { return this._priceTierId }
        public set priceTierId(value: ObjectId) {
            Database.mongodb.collection(PriceTier.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new RequestError(`Price tier with id ${value} doesn't exists.`)
                }
                else {
                    this._priceTierId = value; Database.DirtyDAO.add(this);
                }
            })
        }

        private _occupantId?: ObjectId
        public get occupantId(): ObjectId | undefined { return this._occupantId }
        public set occupantId(value: ObjectId | undefined) {
            Database.mongodb.collection(User.collection_name).findOne({ _id: value }).then(instance => {
                if (instance == null) {
                    throw new Error(`User tier with id ${value} doesn't exists.`)
                }
                else {
                    this._occupantId = value; Database.DirtyDAO.add(this);
                }
            })
        }
        private constructor(
            eventId: ObjectId,
            seatId: ObjectId,
            priceTierId: ObjectId,
            occupantId?: ObjectId
        ) {
            super(collection_name);;
            this._eventId = eventId
            this._seatId = seatId
            this._priceTierId = priceTierId
            this._occupantId = occupantId
        }
    }
}