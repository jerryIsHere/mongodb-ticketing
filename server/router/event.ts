import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { ModifyResult, Document } from "mongoose";
import { v1 } from '../../mongoose-schema/schema'
import { eventModel, IEvent } from "../../mongoose-schema/v1/event";
import { RequestError } from "../database/database";

let eventNotFound = (id: string) => { throw new RequestError(`Event with id ${id} not found.`) }
export namespace Event {
    export function RouterFactory(): Express.Router {
        var event = Router()

        event.use((req: Request, res: Response, next) => {
            if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        event.get("/", async (req: Request, res: Response, next) => {
            if (req.query.list != undefined) {
                eventModel.find().lean().
                    then(doc => next({ success: true, data: doc })).
                    catch(err => next(err))
            }
            else if (req.query.listSelling != undefined) {
                eventModel.find().findSelling().lean().
                    then(doc => next({ success: true, data: doc })).
                    catch(err => next(err))
            }
        })
        event.get("/:eventId", async (req: Request, res: Response, next) => {
            eventModel.findById(req.params.eventId).lean().
                then(doc => next({ success: true, data: doc })).
                catch(err => next(err))
        })
        event.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId
                    var eventDoc = new eventModel(req.body);
                    eventDoc.save().
                        then(_ => next({ success: true })).
                        catch(err => next(err))

                }
            }
        })

        event.patch("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                eventModel.findById(req.params.eventId).
                    then(eventDoc => {
                        if (eventDoc) {
                            Object.keys(req.body).forEach(key => {
                                if (key in eventDoc) {
                                    (eventDoc as any)[key] = req.body[key]
                                }
                            })
                            return eventDoc.save()
                        }
                        else {
                            eventNotFound(req.params.eventId)
                        }
                    }).
                    then(event => next({ success: true, data: event })).
                    catch(err => next(err))
            }
        })

        event.delete("/:eventId", async (req: Request, res: Response, next): Promise<any> => {
            eventModel.findById(req.params.eventId).
                then(eventDoc => {
                    if (eventDoc) {
                        return eventDoc.deleteOne({ includeResultMetadata: true }).exec()
                    }
                    else {
                        eventNotFound(req.params.eventId)
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
        return event
    }
}