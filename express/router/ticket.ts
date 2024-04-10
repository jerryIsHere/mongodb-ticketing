
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { TicketDAO } from '../dao/ticket'
import { RequestError } from "../dao/database";
import { UserDAO } from "../dao/user";

export namespace Ticket {
    export function RouterFactory(): Express.Router {
        var ticket = Router()

        ticket.use((req: Request, res: Response, next) => {
            if (req.method != 'PATH' && req.query.buy != undefined) {
                next()
            }
            else if (req.method != 'GET' && (req.session["user"] as any)?._isAdmin != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" })
            }
            else { next() }
        })

        ticket.get("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.eventId && typeof req.query.eventId == "string") {
                TicketDAO.listByEventId(req.query.eventId, (req.session["user"] as any)?._isAdmin).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                TicketDAO.ofUser((req.session['user'] as any)._id, (req.session["user"] as any)?._isAdmin).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.sold != undefined) {
                TicketDAO.listSold((req.session["user"] as any)?._isAdmin).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.list != undefined) {
                let ids: string[] | undefined
                try {

                    ids = (JSON.parse(req.query.list as string)).filter((value: any) => typeof value == "string")

                } catch (e) {

                }
                if (ids) {
                    TicketDAO.listByIds(ids, false).then(result => {
                        next({ success: true, data: result })
                    }).catch((error) => next(error))
                }
                else {
                    next(new RequestError("unregconized list query"))
                }
            }
        })

        ticket.get("/:ticketId", async (req: Request, res: Response, next) => {
            TicketDAO.getWithDetailsById(req.params.ticketId, (req.session["user"] as any)?._isAdmin).then(result => {
                next({ success: true, data: result })
            }).catch((error) => { next(error) })
        })
        ticket.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.create != undefined) {
                if (req.query.batch != undefined && req.body.tickets && Array.isArray(req.body.tickets)) {
                    var daos: TicketDAO[] = req.body.tickets.map((t: any) => {
                        var dao = new TicketDAO(res, {})
                        dao.eventId = t.eventId
                        dao.seatId = t.seatId
                        dao.priceTierId = t.priceTierId
                        dao.paid = false
                        return dao;
                    })
                    TicketDAO.batchCreate(res, daos).then((tickets: TicketDAO[]) => {
                        next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                    }).catch((error) => next(error))
                }
                else if (
                    req.body.eventId && typeof req.body.eventId == "string" &&
                    req.body.seatId && typeof req.body.seatId == "string" &&
                    req.body.priceTierId && typeof req.body.priceTierId == "string"
                ) {
                    var dao = new TicketDAO(res, {});
                    dao.paid = false
                    var promises: Promise<any>[] = []
                    dao.eventId = req.body.eventId
                    dao.seatId = req.body.seatId
                    dao.priceTierId = req.body.priceTierId
                    dao.create().then((value) => {
                        next({ success: true })
                    }).catch((error) => next(error))

                }
            }
        })
        ticket.patch("", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                if (req.query.buy != undefined) {
                    if (req.session['user'] && (req.session['user'] as any)._id) {
                        TicketDAO.getByIds(res, req.body.ticketIds).then(daos => TicketDAO.batchClaim(res, daos, (req.session['user'] as any)._id)).then((tickets: TicketDAO[]) => {
                            next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                        }).catch((error) => next(error))
                    }
                    else { next(new RequestError("Buying ticket requires a user login")) }
                }
                else if (typeof req.query.priceTier === "string") {
                    TicketDAO.getByIds(res, req.body.ticketIds).then(daos => {
                        if (typeof req.query.priceTier === "string") {
                            return TicketDAO.batchUdatePriceTier(res, daos, req.query.priceTier)
                        }
                        else {
                            next(new RequestError(`${req.query.priceTier} is not of type string`))
                            return []
                        }
                    }
                    ).then((tickets: TicketDAO[]) => {
                        next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                    }).catch((error) => next(error))
                }
            }
        })
        ticket.patch("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.buy != undefined) {
                if (req.session['user'] && (req.session['user'] as any)._id) {
                    TicketDAO.getById(res, req.params.ticketId).then(dao => dao.claim((req.session['user'] as any)._id)).then((value: TicketDAO) => {
                        next({ success: true })
                    }).catch((error) => next(error))
                }
                else { next(new RequestError("Buying ticket requires a user login")) }
            }
            if (req.query.payment != undefined &&
                (req.body.paid != undefined || req.body.paid == null || typeof req.body.paid == "boolean") &&
                (req.body.paymentRemark == undefined || req.body.paymentRemark == null || typeof req.body.paymentRemark == "string") &&
                req.session['user'] && (req.session['user'] as any)._isAdmin) {
                TicketDAO.getById(res, req.params.ticketId).then(dao => {
                    dao.paid = req.body.paid;
                    dao.paymentRemark = req.body.paymentRemark;
                    return dao.update()
                }).then((value: TicketDAO) => {
                    next({ success: true })
                }).catch((error) => next(error))
            }
            else if (req.query.void != undefined) {
                TicketDAO.getById(res, req.params.ticketId).then(dao => dao.void()
                ).then((value: TicketDAO) => {
                    next({ success: true })
                }).catch((error) => next(error))

            }
        })

        ticket.delete("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.batch != undefined && req.body.ticketIds && Array.isArray(req.body.ticketIds)) {
                TicketDAO.getByIds(res, req.body.ticketIds).then(daos => TicketDAO.batchDelete(res, daos)).then((tickets: TicketDAO[]) => {
                    next({ success: true, data: tickets.map(ticket => ticket.Hydrated()) })
                }).catch((error) => next(error))
            }
        })

        ticket.delete("/:ticketId", async (req: Request, res: Response, next): Promise<any> => {
            TicketDAO.getById(res, req.params.ticketId).then(dao => dao.delete()).then((value) => {
                next({ success: true })
            }).catch((error) => { next(error) })
        })
        return ticket
    };

}