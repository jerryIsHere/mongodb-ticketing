"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const express_1 = require("express");
const event_1 = require("../../mongoose-schema/v1/event");
var Event;
(function (Event) {
    function RouterFactory() {
        var event = (0, express_1.Router)();
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
                next({ success: true, data: await event_1.eventModel.find().lean().exec() });
            }
            else if (req.query.listSelling != undefined) {
                next({ success: true, data: await event_1.eventModel.find().findSelling().lean().exec() });
            }
        });
        event.get("/:eventId", async (req, res, next) => {
            next({ success: true, data: await event_1.eventModel.findById(req.params.eventId).lean().exec() });
        });
        event.post("/", async (req, res, next) => {
            if (req.query.create != undefined) {
                if (req.body.venueId && typeof req.body.venueId == "string") {
                    let venueId = req.body.venueId;
                    var eventDoc = new event_1.eventModel({
                        eventname: req.body.eventname,
                        datetime: req.body.datetime,
                        duration: req.body.duration,
                        saleInfos: req.body.saleInfos,
                        shoppingCartSize: req.body.shoppingCartSize,
                        venueId: req.body.venueId
                    });
                    await eventDoc.save().catch((err) => next(err));
                    next({ success: true });
                }
            }
        });
        event.patch("/:eventId", async (req, res, next) => {
            if (req.params.eventId && typeof req.params.eventId == "string") {
                let eventDoc = await event_1.eventModel.findByIdAndUpdate(req.params.eventId, req.body, { returnDocument: "after", lean: true }).exec().catch((err) => next(err));
                next({ success: true, data: eventDoc });
            }
        });
        event.delete("/:eventId", async (req, res, next) => {
            let deleteResult = await event_1.eventModel.findByIdAndDelete(req.params.eventId, { includeResultMetadata: true }).exec().catch((err) => next(err));
            if (deleteResult && deleteResult.ok) {
                next({ success: true });
            }
            else {
                next({ success: false });
            }
        });
        return event;
    }
    Event.RouterFactory = RouterFactory;
})(Event = exports.Event || (exports.Event = {}));
