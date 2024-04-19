import { Router } from "express";
import { SeatDAO, coordTypeCheck } from "../dao/seat";
export var Seat;
(function (Seat) {
    function RouterFactory() {
        var seat = Router();
        seat.use((req, res, next) => {
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        seat.get("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                SeatDAO.listByVenueId(res, req.query.venueId).then(result => {
                    next({ success: true, data: result.map(dao => dao.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        seat.post("/", async (req, res, next) => {
            if (req.query.venueId && typeof req.query.venueId == "string") {
                let venueId = req.query.venueId;
                if (req.query.batch != undefined && req.body.seats && Array.isArray(req.body.seats)) {
                    var SeatTypeCheck = (s) => {
                        return typeof s.no == "number" &&
                            typeof s.row == "string" &&
                            s.coord &&
                            coordTypeCheck(s.coord);
                    };
                    var daos = req.body.seats.filter((s) => SeatTypeCheck(s)).map((s) => {
                        var dao = new SeatDAO(res, {
                            row: s.row,
                            no: Number(s.no),
                            coord: s.coord
                        });
                        dao.venueId = venueId;
                        return dao;
                    });
                    SeatDAO.batchCreate(res, daos).then((seats) => {
                        next({ success: true, data: seats.map(seat => seat.Hydrated()) });
                    }).catch((error) => next(error));
                }
            }
        });
        seat.patch("/:seatId", async (req, res, next) => {
            if (req.body.coord) {
                var dao = await SeatDAO.getById(res, req.params.seatId);
                dao.coord = req.body.coord;
                dao.update().then((seat) => {
                    next({ success: true, data: seat.Hydrated() });
                }).catch((error) => next(error));
            }
        });
        seat.delete("/", async (req, res, next) => {
            if (req.query.batch != undefined && req.body.seatIds && Array.isArray(req.body.seatIds)) {
                SeatDAO.getByIds(res, req.body.seatIds).then(daos => SeatDAO.batchDelete(res, daos)).then((seats) => {
                    next({ success: true, data: seats.map(seat => seat.Hydrated()) });
                }).catch((error) => next(error));
            }
        });
        seat.delete("/:seatId", async (req, res, next) => {
            SeatDAO.getById(res, req.params.seatId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => { next(error); });
        });
        return seat;
    }
    Seat.RouterFactory = RouterFactory;
})(Seat || (Seat = {}));
