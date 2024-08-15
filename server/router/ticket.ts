
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { v1 } from '../../mongoose-schema/schema'
import { RequestError } from "../database/database";
import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import { IPaymentInfo, ITicket, ticketModel } from "../../mongoose-schema/v1/ticket";
import { eventModel } from "../../mongoose-schema/v1/event";


export namespace Ticket {
    export function RouterFactory(): Express.Router {
        var ticket = Router()
        var shouldShowOccupant = (session?: SessionData) => {
            if (session && session.user)
                return session.user.hasAdminRight || session.user.isCustomerSupport
            return false
        }

        ticket.use((req: Request, res: Response, next) => {
            if (req.method == 'PATCH' && req.query.buy != undefined) {
                return next()
            }
            if (req.method == 'PATCH' && (req.query.void != undefined || req.query.verify != undefined) && (req.session["user"] as any)?.isCustomerSupport == true) {

                return next()
            }
            else if (req.method != 'GET' && (req.session["user"] as any)?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        ticket.get("/", async (req: Request, res: Response, next): Promise<any> => {
            let x = (await ticketModel.find({}).then())
            x?.map(y => y.disclose())
            if (req.query.eventId && typeof req.query.eventId == "string") {
                ticketModel.find().findByEventId(req.query.eventId).
                    then(doc =>
                        next({
                            success: true, data: doc?.map(doc => doc.disclose())
                        })).
                    catch((err) => next(err))
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                let userId = (req.session['user'] as any)._id
                ticketModel.find().findByPurchaser(userId).
                    then(doc =>
                        next({
                            success: true,
                            data: doc?.map(doc => doc.discloseToClient(userId))
                        })).
                    catch((err) => next(err))
            }
            else if (req.query.sold != undefined) {
                let showOccupant = shouldShowOccupant(req.session)
                ticketModel.find().findSold().
                    then(doc =>
                        next({
                            success: true,
                            data: doc?.map(doc => showOccupant ? doc.fullyPopulate() : doc.disclose())
                        })).
                    catch((err) => next(err))
            }
            else if (req.query.list != undefined && req.query.userId && typeof req.query.userId === "string") {
                let ids: string[] | undefined
                try {
                    ids = (JSON.parse(req.query.list as string)).filter((value: any) => typeof value == "string")
                } catch (e) {
                }
                if (req.session["user"] != null && req.session["user"]._id && req.session["user"]._id != req.query.userId) {
                    next(new RequestError("This reveals information of another user"))
                    return
                }
                else {
                    let userId = (req.session["user"] as any)._id
                    if (ids) {
                        ticketModel.find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).
                            then(docs =>
                                next({
                                    sucess: true,
                                    data: docs.map(doc => doc.discloseToClient(userId))
                                }));
                    }
                    else {
                        next(new RequestError("unregconized list query"))
                    }
                }
            }
        })

        ticket.get("/:ticketId", async (req: Request, res: Response, next) => {
            let showOccupant = shouldShowOccupant(req.session)
            ticketModel.findById(req.params.eventId).
                then(doc => next({
                    success: true,
                    data: showOccupant ? doc?.fullyPopulate() : doc?.disclose()
                })).
                catch((err) => next(err))
        }
        )
        ticket.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    return ticketModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session.startTransaction();
                            return ticketModel.create(req.body.tickets as ITicket[])
                        }).
                        then(docs => docs.map(doc => doc.fullyPopulate())).
                        then(json => { return { success: true, data: json } })
                }
                else if (
                    req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string"
                ) {
                    var ticketDoc = new ticketModel(req.body);
                    await ticketDoc.save().catch((err) => next(err))
                    next({ success: true })

                }
            }
        })
        ticket.patch("", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids: string[] = req.body.ticketIds
                if (req.query.buy != undefined) {
                    if (req.session['user'] && (req.session['user'] as any)._id) {
                        let userId = (req.session['user'] as any)._id
                        return ticketModel.startSession().
                            then(_session => {
                                res.locals.session = _session;
                                res.locals.session.startTransaction();
                                return ticketModel.bulkPurchase(userId, ids)
                            }).
                            then(docs => next({ success: true })).
                            catch(err => next(err))
                    }
                    else { next(new RequestError("Buying ticket requires a user login")) }
                }
                else if (typeof req.query.tierName == "string") {
                    let tierName = req.query.tierName
                    return ticketModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session.startTransaction();
                            return ticketModel.batchUpdatePriceTier(ids, tierName)
                        }).
                        then(docs => docs.map(doc => doc.fullyPopulate())).
                        then(json => { return { success: true, data: json } })
                }
            }
        })
        ticket.patch("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.verify != undefined &&
                (req.body.confirmedBy != undefined || req.body.confirmedBy == null || typeof req.body.confirmedBy == "string") &&
                (req.body.remark == undefined || req.body.remark == null || typeof req.body.remark == "string")) {
                let info: IPaymentInfo = {
                    confirmedBy: req.body.securedBy,
                    remark: req.body.remark,
                    confirmationDate: new Date()
                }
                ticketModel.findByIdAndUpdate(req.params.ticketId, { paymentInfo: info },
                    { returnDocument: 'after' }
                ).
                    then(doc => next({ success: true, data: doc?.fullyPopulate() })).
                    catch((err) => next(err))
            }
            else if (req.query.void != undefined) {
                let username = (req.session?.user as any)?.username
                ticketModel.findById(req.params.ticketId).
                    then(doc => doc?.voidPurchased(username)).
                    then(doc => next({ success: true })).
                    catch((err) => next(err))

            }
        })

        ticket.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids: string[] = req.body.ticketIds
                ticketModel.startSession().
                    then(_session => {
                        res.locals.session = _session;
                        res.locals.session.startTransaction();
                        return ticketModel.deleteMany({ _id: { $in: ids.map(id => new ObjectId(id)) } }, ids)
                    }).
                    then(docs => next({ success: true })).
                    catch(err => next(err))
            }
        })

        ticket.delete("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            let deleteResult = await ticketModel.findByIdAndDelete(req.params.ticketId,
                { includeResultMetadata: true }).exec().catch((err) => next(err))
            if (deleteResult && deleteResult.ok)  {
                next({ success: true })
            }
            else {
                next({ success: false })
            }
        })
        return ticket
    };

}