
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { v1 } from '../../mongoose-schema/schema'
import { RequestError } from "../database/database";
import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import { IClientTicket, IDisclosableTicket, IFullyPopulatedTicket, IPaymentInfo, IPopulatedPaymentInfo, IPopulatedPurchaseInfo, ITicket, lookupQuery, ticketModel } from "../../mongoose-schema/v1/ticket";
import { eventModel, IEvent } from "../../mongoose-schema/v1/event";
import { IUser } from "../../mongoose-schema/v1/user";
import { ISeat } from "../../mongoose-schema/v1/seat";
import { OperationError } from "../../mongoose-schema/error";

let ticketNotFound = (id: string) => { throw new RequestError(`Ticket with id ${id} not found.`) }
export namespace Ticket {
    export function RouterFactory(): Express.Router {
        var ticket = Router()
        var InferPopulateType = (req: Request): "full" | "none" => {
            let session: SessionData = req.session
            if (session && session.user && (session.user.hasAdminRight || session.user.isCustomerSupport)) {
                if (req.query.populate == "full") {
                    return "full"
                }
                else {
                    return "none"
                }
            }
            return "none"
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
            let populateType = InferPopulateType(req)
            if (req.query.eventId && typeof req.query.eventId == "string" && req.query.sold == undefined) {
                ticketModel.aggregate<IDisclosableTicket>(lookupQuery({
                    $match: {
                        eventId: new ObjectId(req.query.eventId)
                    }
                }, { populateType: populateType })).
                    then(async docs =>
                        next({
                            success: true, data: docs
                        })).
                    catch(err => next(err))
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                let userId = (req.session['user'] as any)._id
                ticketModel.aggregate<IClientTicket>(lookupQuery({
                    $match: {
                        "purchaseInfo.purchaserId": new ObjectId(userId)
                    }
                }, { populateType: "purchaser", checkIfBelongsToUser: userId })).
                    then(async tickets =>
                        next({
                            success: true,
                            data: tickets
                        })).
                    catch(err => next(err))
            }
            else if (req.query.sold != undefined) {
                let populateType = InferPopulateType(req)
                let eventId
                if (req.query.eventId != undefined && typeof req.query.eventId === "string")
                    eventId = req.query.eventId
                ticketModel.aggregate<IFullyPopulatedTicket<IEvent, ISeat, IPopulatedPurchaseInfo<IUser>, IPopulatedPaymentInfo<IUser>>>(lookupQuery({
                    $match: {
                        $and: [
                            ...[{ purchaseInfo: { $ne: null } }],
                            ...eventId ? [{ eventId: new ObjectId(eventId) }] : []
                        ]
                    }
                }, { populateType: populateType })).
                    then(async doc =>
                        next({
                            success: true,
                            data: doc
                        })).
                    catch(err => next(err))
            }
            else if (req.query.list != undefined && req.query.userId && typeof req.query.userId === "string") {
                let ids: string[]
                try {
                    ids = (JSON.parse(req.query.list as string)).filter((value: any) => typeof value == "string")
                } catch (e) {
                    return next(new RequestError("Ids are not in regconized format"))
                }
                if (req.session["user"] != null && req.session["user"]._id && req.session["user"]._id != req.query.userId) {
                    next(new RequestError("This reveals information of another user"))
                    return
                }
                else {
                    let userId = (req.session["user"] as any)._id
                    ticketModel.aggregate<IFullyPopulatedTicket<IEvent, ISeat, IPopulatedPurchaseInfo<IUser>, IPopulatedPaymentInfo<IUser>>>(lookupQuery({
                        $match: {
                            _id: { $in: ids.map(id => new ObjectId(id)) }
                        }
                    }, { populateType: "none", checkIfBelongsToUser: userId })).
                        then(async docs =>
                            next({
                                sucess: true,
                                data: docs
                            }));
                }
            }
        })

        ticket.get("/:ticketId", async (req: Request, res: Response, next) => {
            let populateType = InferPopulateType(req)
            ticketModel.aggregate<IFullyPopulatedTicket<IEvent, ISeat, IPopulatedPurchaseInfo<IUser>, IPopulatedPaymentInfo<IUser>>>(lookupQuery({
                $match: {
                    _id: new ObjectId(req.params.ticketId)
                }
            }, { populateType: populateType, })).
                then(async docs =>
                    docs.length > 0 ?
                        next({
                            success: true,
                            data: docs[0]
                        }) :
                        ticketNotFound(req.params.ticketId)).
                catch(err => next(err))
        }
        )
        ticket.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    return ticketModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session ? res.locals.session.startTransaction() : null;
                            return ticketModel.create(req.body.tickets as ITicket[])
                        }).
                        then(async docs => await Promise.all(docs.map(doc => doc.fullyPopulate()))).
                        then(json => next({ success: true, data: json })).
                        catch(err => next(err))
                }
                else if (
                    req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string"
                ) {
                    var ticketDoc = new ticketModel(req.body);
                    ticketDoc.save().
                        then(_ => next({ success: true })).
                        catch(err => next(err))

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
                                res.locals.session ? res.locals.session.startTransaction() : null;
                                return ticketModel.bulkPurchase(userId, ids, _session)
                            }).
                            then(docs => next({ success: true, data: docs })).
                            catch(err => next(err))
                    }
                    else { next(new RequestError("Buying ticket requires a user login")) }
                }
                else if (typeof req.query.tierName == "string") {
                    let tierName = req.query.tierName
                    return ticketModel.startSession().
                        then(_session => {
                            res.locals.session = _session;
                            res.locals.session ? res.locals.session.startTransaction() : null;
                            return ticketModel.batchUpdatePriceTier(ids, tierName)
                        }).
                        then(async docs => await Promise.all(docs.map(doc => doc.fullyPopulate()))).
                        then(json => next({ success: true, data: json }))
                }
            }
        })
        ticket.patch("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.verify != undefined &&
                (req.body.confirmedBy != undefined || req.body.confirmerId == null || typeof req.body.confirmerId == "string") &&
                (req.body.remark == undefined || req.body.remark == null || typeof req.body.remark == "string")) {
                ticketModel.findById(req.params.ticketId).
                    then(ticketDoc => {
                        if (ticketDoc) {

                            if (req.body.confirmedBy != "") {
                                let info: IPaymentInfo = {
                                    confirmerId: (req.session['user'] as any)._id,
                                    confirmedBy: req.body.confirmedBy,
                                    remark: req.body.remark,
                                    confirmationDate: new Date()
                                }
                                ticketDoc.paymentInfo = info
                            }
                            else {
                                ticketDoc.paymentInfo = undefined
                            }
                            return ticketDoc.save()
                        }
                        else {
                            ticketNotFound(req.params.ticketId)
                        }
                    }).
                    then(async doc => next({ success: true, data: await doc?.fullyPopulate() })).
                    catch(err => next(err))
            }
            else if (req.query.void != undefined) {
                let username = (req.session?.user as any)?.username
                ticketModel.findById(req.params.ticketId).
                    then(doc => doc?.voidPurchased(username)).
                    then(doc => next({ success: true })).
                    catch(err => next(err))

            }
        })

        ticket.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                let ids: string[] = req.body.ticketIds
                ticketModel.startSession().
                    then(_session => {
                        res.locals.session = _session;
                        res.locals.session ? res.locals.session.startTransaction() : null;
                        return ticketModel.deleteMany({ _id: { $in: ids.map(id => new ObjectId(id)) } }, ids).exec()
                    }).
                    then(docs => next({ success: true })).
                    catch(err => next(err))
            }
        })

        ticket.delete("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            ticketModel.findById(req.params.ticketId).
                then(ticketDoc => {
                    if (ticketDoc) {
                        return ticketDoc.deleteOne({ includeResultMetadata: true }).exec()
                    }
                    else {
                        ticketNotFound(req.params.ticketId)
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
        return ticket
    };

}