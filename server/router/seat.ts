
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { HydratedDocument } from "mongoose";
import { v1 } from '../../mongoose-schema/schema'
import { ISeat, seatModel } from "../../mongoose-schema/v1/seat";
import { RequestError } from "../database/database";

let seatNotFound = (id: string) => { throw new RequestError(`Seat with id ${id} not found.`) }
export namespace Seat {
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        seat.get("/", async (req: Request, res: Response, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                seatModel.find().findByVenueId(req.query.venueId).lean().
                    then(doc => next({ success: true, data: doc })).
                    catch(err => next(err))
            }
        })
        seat.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    return seatModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session ? res.locals.session.startTransaction() : null;
                            return seatModel.create(req.body.seats.map((s: ISeat) => {
                                return {
                                    ...s,
                                    ...{
                                        venueId: req.query.venueId
                                    }
                                }
                            }) as ISeat[])
                        }).
                        then(docs => docs.map(doc => doc.toJSON())).
                        then(json => next({ success: true, data: json } )).
                        catch(err => next(err))
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.coord) {
                seatModel.findById(req.params.seatId).
                    then(seatDoc => {
                        if (seatDoc) {
                            Object.keys(req.body).forEach(key => {
                                if (key in seatDoc) {
                                    (seatDoc as any)[key] = req.body[key]
                                }
                            })
                            return seatDoc.save()
                        }
                        else {
                            seatNotFound(req.params.seatId)
                        }
                    }).
                    then(seat => next({ success: true, data: seat })).
                    catch(err => next(err))
            }
        })
        seat.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {

                return seatModel.startSession().
                    then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return Promise.all(req.body.seatIds.map(async (seatId: string) => {
                            return seatModel.findById(seatId).
                                then(seatDoc => {
                                    if (seatDoc) {
                                        return seatDoc.deleteOne({ includeResultMetadata: true }).exec()
                                    }
                                    else {
                                        seatNotFound(req.params.seatId)
                                    }
                                })
                        }))
                    }).
                    then(json => { next({ success: true, data: json }) }).
                    catch((err: any) => next(err))
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            seatModel.findById(req.params.seatId).
                then(seatDoc => {
                    if (seatDoc) {
                        return seatDoc.deleteOne({ includeResultMetadata: true }).exec()
                    }
                    else {
                        seatNotFound(req.params.seatId)
                    }
                }).
                then((deleteResult) => {
                    if (deleteResult && deleteResult.deletedCount > 0) {
                        next({ success: true })
                    }
                    else {
                        next({ success: false })
                    }
                }).catch((err: any) => next(err))
        })
        return seat
    }
}