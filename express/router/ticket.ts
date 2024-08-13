
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { TicketDAO } from '../dao/ticket'
import { RequestError } from "../database";
import { UserDAO } from "../dao/user";
import { SessionData } from "express-session";


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
            if (req.query.eventId && typeof req.query.eventId == "string") {
                TicketDAO.listByEventId(req.query.eventId, { showOccupant: shouldShowOccupant(req.session) }).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.my != undefined && req.session['user'] && (req.session['user'] as any)._id) {
                TicketDAO.ofUser((req.session['user'] as any)._id, { showOccupant: shouldShowOccupant(req.session) }).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
            }
            else if (req.query.sold != undefined) {
                TicketDAO.listSold({ showOccupant: shouldShowOccupant(req.session) }).then(result => {
                    next({ success: true, data: result })
                }).catch((error) => next(error))
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
                if (ids) {
                    TicketDAO.listByIds(ids, {
                        showOccupant: false,
                        checkIfBelongsToUser: req.query.userId
                    }).then(result => {
                        next({ success: true, data: result })
                    }).catch((error) => next(error))
                }
                else {
                    next(new RequestError("unregconized list query"))
                }
            }
        })

        ticket.get("/:ticketId", async (req: Request, res: Response, next) => {
            TicketDAO.getWithDetailsById(req.params.ticketId, { showOccupant: shouldShowOccupant(req.session) }).then(result => {
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
                        dao.securedBy = ""
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
                    dao.securedBy = ""
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
            if (req.query.verify != undefined &&
                (req.body.securedBy != undefined || req.body.securedBy == null || typeof req.body.securedBy == "string") &&
                (req.body.remark == undefined || req.body.remark == null || typeof req.body.remark == "string")) {
                TicketDAO.getById(res, req.params.ticketId).then(dao => {
                    dao.securedBy = req.body.securedBy;
                    dao.remark = req.body.remark;
                    return dao.update()
                }).then((value: TicketDAO) => {
                    next({ success: true })
                }).catch((error) => next(error))
            }
            else if (req.query.void != undefined) {
                TicketDAO.getById(res, req.params.ticketId).then(dao => dao.void((req.session?.user as any)?.username)
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