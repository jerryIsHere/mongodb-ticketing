
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { HydratedDocument } from "mongoose";
import { v1 } from '../../mongoose-schema/schema'
import { ISeat, seatModel } from "../../mongoose-schema/v1/seat";

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
                    catch((err => next(err)))
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
                        then(json => { return { success: true, data: json } })
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.coord) {
                let seatDoc = await seatModel.findByIdAndUpdate(req.params.seatId,
                    { coord: req.body.coord }
                    , { returnDocument: "after", lean: true }).exec().catch((err) => next(err))
                next({ success: true, data: seatDoc })
            }
        })
        seat.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {

                return seatModel.startSession().
                    then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return Promise.all(req.body.seatIds.map(async (seatId: string) => {
                            return seatModel.findByIdAndDelete(seatId).exec()
                        }))
                    }).
                    then(docs => docs.map(doc => doc.toJSON())).
                    then(json => { return { success: true, data: json } })
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            seatModel.findByIdAndDelete(req.params.seatId,
                { includeResultMetadata: true }).then((deleteResult) => {
                    if (deleteResult && deleteResult.ok) {
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