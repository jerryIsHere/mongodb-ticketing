
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { HydratedDocument } from "mongoose";
import { v1 } from '~/mongoose-schema/schema'
import { ISeat } from "~/mongoose-schema/v1/seat";

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
                next({ success: true, data: await v1.Seat.seatModel.find().findByVenueId(req.query.venueId).lean().exec() })
            }
        })
        seat.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    return v1.Seat.seatModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session.startTransaction();
                            return v1.Seat.seatModel.create(req.body.seats as ISeat[])
                        }).
                        then(docs => docs.map(doc => doc.toJSON())).
                        then(json => { return { success: true, data: json } })
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.coord) {
                let seatDoc = await v1.Seat.seatModel.findByIdAndUpdate(req.params.seatId,
                    { coord: req.body.coord }
                    , { returnDocument: "after", lean: true }).exec().catch((err) => next(err))
                next({ success: true, data: seatDoc })
            }
        })
        seat.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {

                    return v1.Seat.seatModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session.startTransaction();
                            return Promise.all(req.body.seatIds.map(async (seatId: string)=>{
                                return v1.Seat.seatModel.findByIdAndDelete(seatId).exec()
                            }))
                        }).
                        then(docs => docs.map(doc => doc.toJSON())).
                        then(json => { return { success: true, data: json } })
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            let deleteResult = await v1.Seat.seatModel.findByIdAndDelete(req.params.seatId,
                { includeResultMetadata: true }).exec().catch((err) => next(err))
            if (deleteResult && deleteResult.ok)  {
                next({ success: true })
            }
            else {
                next({ success: false })
            }
        })
        return seat
    }
}