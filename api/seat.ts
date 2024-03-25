
import { Request, Response, Router } from "express";
import * as Express from "express-serve-static-core"
import { SeatDAO } from "../dao/seat";

export namespace Seat {
    export function RouterFactory(): Express.Router {
        var seat = Router()

        seat.get("/", async (req: Request, res: Response, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                SeatDAO.listByVenueId(req.query.venueId).then(result => {
                    res.json({ success: true, data: result.map(dao => dao.Serialize(false))  })
                }).catch((error) => next(error))
            }
        })
        seat.post("/", async (req: Request, res: Response, next): Promise<any> => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    var daos: SeatDAO[] = req.body.seats.map((seat: { row: string, no: string }) => {
                        var dao = new SeatDAO({
                            row: seat.row,
                            no: Number(seat.no),
                        })
                        dao.venueId = venueId
                        return dao;
                    })
                    SeatDAO.batchCreate(daos).then((seats: SeatDAO[]) => {
                        res.json({ success: true, data: seats.map(seat => seat.Serialize(false)) })
                    }).catch((error) => next(error))
                }
            }
        })
        seat.patch("/:seatId", async (req: Request, res: Response, next): Promise<any> => {
            if (req.body.tierName && req.body.price) {
                var dao = new SeatDAO({})
                dao.update().then((value) => {
                    res.json({ success: true })
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