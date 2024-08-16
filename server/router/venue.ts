import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { Database, RequestError } from "../database/database";
import { venueModel } from "../../mongoose-schema/v1/venue";
import { IEvent } from "../../mongoose-schema/v1/event";
import { DeleteResult, ModifyResult } from "mongodb";
let venueNotFound = (id: string) => { throw new RequestError(`Venue with id ${id} not found.`) }
export namespace Venue {
    export function RouterFactory(): Express.Router {
        var venue = Router()

        venue.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        venue.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                venueModel.find().lean().
                    then(doc => next({ success: true, data: doc })).
                    catch(err => next(err))
            }
        })
        venue.get("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            venueModel.findById(req.params.venueId).lean().
                then(doc => next({ success: true, data: doc })).
                catch(err => next(err))
        })

        venue.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                var venueDoc = new venueModel({
                    venuename: req.body.venuename,
                    sections: req.body.sections
                });
                venueDoc.save().
                    then(_ => next({ success: true })).
                    catch(err => next(err))
            }
        })

        venue.patch("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.venuename && req.body.sections) {
                venueModel.findById(req.params.venueId).
                    then(venueDoc => {
                        if (venueDoc) {
                            Object.keys(req.body).forEach(key => {
                                if (key in venueDoc) {
                                    (venueDoc as any)[key] = req.body[key]
                                }
                            })
                            return venueDoc.save()
                        }
                        else {
                            throw venueNotFound(req.params.venueId)
                        }
                    }).
                    then(venueDoc => next({ success: true, data: venueDoc })).
                    catch(err => next(err))
            }
        })

        venue.delete("/:venueId", async (req: Request, res: Response, next): Promise<any> => {
            venueModel.findById(req.params.venueId).
                then(venueDoc => {
                    if (venueDoc) {
                        return venueDoc.deleteOne({ includeResultMetadata: true }).exec()
                    }
                    else {
                        throw venueNotFound(req.params.venueId)
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
        return venue
    };
}