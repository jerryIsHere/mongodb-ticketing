"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Venue = void 0;
const express_1 = require("express");
const venue_1 = require("../../mongoose-schema/v1/venue");
var Venue;
(function (Venue) {
    function RouterFactory() {
        var venue = (0, express_1.Router)();
        venue.use((req, res, next) => {
            if (req.method != 'GET' && req.session["user"]?.hasAdminRight != true) {
                res.status(401).json({ success: false, reason: "Unauthorized access" });
            }
            else {
                next();
            }
        });
        venue.get("/", async (req, res, next) => {
            if (req.query.list != undefined) {
                venue_1.venueModel.find().lean().
                    then(doc => next({ success: true, data: doc })).
                    catch((err => next(err)));
            }
        });
        venue.get("/:venueId", async (req, res, next) => {
            venue_1.venueModel.findById(req.params.venueId).lean().
                then(doc => next({ success: true, data: doc })).
                catch((err => next(err)));
        });
        venue.post("/", async (req, res, next) => {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                var eventDoc = new venue_1.venueModel({
                    venuename: req.body.venuename,
                    sections: req.body.sections
                });
                await eventDoc.save().catch((err) => next(err));
                next({ success: true });
            }
        });
        venue.patch("/:venueId", async (req, res, next) => {
            if (req.body.venuename && req.body.sections) {
                let eventDoc = await venue_1.venueModel.findByIdAndUpdate(req.params.venueId, req.body, { returnDocument: "after", lean: true }).exec().catch((err) => next(err));
                next({ success: true, data: eventDoc });
            }
        });
        venue.delete("/:venueId", async (req, res, next) => {
            venue_1.venueModel.findByIdAndDelete(req.params.venueId, { includeResultMetadata: true }).then((deleteResult) => {
                if (deleteResult && deleteResult.ok) {
                    next({ success: true });
                }
                else {
                    next({ success: false });
                }
            }).catch((err) => next(err));
        });
        return venue;
    }
    Venue.RouterFactory = RouterFactory;
    ;
})(Venue = exports.Venue || (exports.Venue = {}));
