import { Router } from "express";
import { EventDAO } from "../dao/event";
export var Event;
(function (Event) {
    function RouterFactory() {
        var event = Router();
        event.use((req, res, next) => {
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        event.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                EventDAO.listAll().then((result) => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
            else if (req.query.listSelling != undefined) {
                EventDAO.listSelling().then((result) => {
                    next({ success: true, data: result });
                }).catch((error) => next(error));
            }
        });
        event.get("/:eventId", async (req, res, next) => {
            EventDAO.getById(res, req.params.eventId).then(result => {
                if (result)
                    next({ success: true, data: result.Hydrated() });
            }).catch((error) => next(error));
        });
        event.post("/", async (req, res, next) => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId;
                    var dao = new EventDAO(res, {
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                        startFirstRoundSellDate: req.body.startFirstRoundSellDate,
                        endFirstRoundSellDate: req.body.endFirstRoundSellDate,
                        startSecondRoundSellDate: req.body.startSecondRoundSellDate,
                        endSecondRoundSellDate: req.body.endSecondRoundSellDate,
                        shoppingCartSize: req.body.shoppingCartSize,
                        firstRoundTicketQuota: req.body.firstRoundTicketQuota,
                        secondRoundTicketQuota: req.body.secondRoundTicketQuota,
                    });
                    dao.venueId = req.body.venueId;
                    dao.create().then((value) => {
                        next({ success: true });
                    }).catch((error) => next(error));
                }
            }
        });
        event.patch("/:eventId", async (req, res, next) => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                EventDAO.getById(res, req.params.eventId).then((dao) => {
                    dao.eventname = req.body.eventname;
                    dao.datetime = req.body.datetime;
                    dao.startFirstRoundSellDate = req.body.startFirstRoundSellDate;
                    dao.endFirstRoundSellDate = req.body.endFirstRoundSellDate;
                    dao.startSecondRoundSellDate = req.body.startSecondRoundSellDate;
                    dao.endSecondRoundSellDate = req.body.endSecondRoundSellDate;
                    dao.shoppingCartSize = req.body.shoppingCartSize;
                    dao.firstRoundTicketQuota = req.body.firstRoundTicketQuota;
                    dao.secondRoundTicketQuota = req.body.secondRoundTicketQuota;
                    dao.duration = req.body.duration;
                    dao.venueId = req.body.venueId;
                    return dao.update();
                }).then((value) => {
                    next({ success: true, data: value.Hydrated() });
                }).catch((error) => next(error));
            }
        });
        event.delete("/:eventId", async (req, res, next) => {
            EventDAO.getById(res, req.params.eventId).then(dao => dao.delete().then((value) => {
                next({ success: true });
            })).catch((error) => next(error));
        });
        return event;
    }
    Event.RouterFactory = RouterFactory;
})(Event || (Event = {}));
