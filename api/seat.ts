
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { SeatDAO } from "../dao/seat";

export namespace Seat {
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/", async (req: Request, res: Response, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                SeatDAO.listByVenueId(req.query.venueId).then(result => {
                    res.json({ success: true, data: result.map(dao => dao.Hydrated()) })
                }).catch((error) => next(error))
            }
        })
        seat.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    type seatType = { no: number, row: string, coord: { x: number, y: number, sectX: number, sectY: number } }
                    var SeatTypeCheck = (s: seatType): s is seatType => {
                        return typeof s.no == "number" &&
                            typeof s.row == "string" &&
                            s.coord &&
                            typeof s.coord.x == "number" &&
                            typeof s.coord.y == "number" &&
                            typeof s.coord.sectX == "number" &&
                            typeof s.coord.sectY == "number"
                    }
                    var daos: SeatDAO[] = req.body.seats.filter((s: seatType) => SeatTypeCheck(s)).map((s: any) => {
                        var dao = new SeatDAO({
                            row: s.row,
                            no: Number(s.no),
                            coord: s.coord
                        })
                        dao.venueId = venueId
                        return dao;
                    })
                    SeatDAO.batchCreate(daos).then((seats: SeatDAO[]) => {
                        res.json({ success: true, data: seats.map(seat => seat.Hydrated()) })
                    }).catch((error) => next(error))
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.coord) {
                type coordType = { x: number, y: number, sectX: number, sectY: number }
                var coordTypeCheck = (c: coordType): c is coordType => {
                    return typeof c.x == "number" &&
                        typeof c.y == "number" &&
                        typeof c.sectX == "number" &&
                        typeof c.sectY == "number"
                }
                var dao = await SeatDAO.getById(req.params.seatId)
                dao.coord = req.body.coord
                dao.update().then((seat: SeatDAO) => {
                    res.json({ success: true, data: seat.Hydrated() })
                }).catch((error) => next(error))
            }
        })
        seat.delete("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            SeatDAO.getById(req.params.seatId).then(dao => dao.delete().then((value) => {
                res.json({ success: true })
            })).catch((error) => { next(error) })
        })
        return seat
    }
}