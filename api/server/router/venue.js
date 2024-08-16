"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Venue = void 0;
const express_1 = require("express");
const database_1 = require("../database/database");
const venue_1 = require("../../mongoose-schema/v1/venue");
let venueNotFound = (id) => { throw new database_1.RequestError(`Venue with id ${id} not found.`); };
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
                    catch(err => next(err));
            }
        });
        venue.get("/:venueId", async (req, res, next) => {
            venue_1.venueModel.findById(req.params.venueId).lean().
                then(doc => next({ success: true, data: doc })).
                catch(err => next(err));
        });
        venue.post("/", async (req, res, next) => {
            if (req.query.create != undefined && req.body.venuename && req.body.sections) {
                var venueDoc = new venue_1.venueModel({
                    venuename: req.body.venuename,
                    sections: req.body.sections
                });
                venueDoc.save().
                    then(_ => next({ success: true })).
                    catch(err => next(err));
            }
        });
        venue.patch("/:venueId", async (req, res, next) => {
            if (req.body.venuename && req.body.sections) {
                venue_1.venueModel.findById(req.params.venueId).
                    then(venueDoc => {
                    if (venueDoc) {
                        Object.keys(req.body).forEach(key => {
                            if (key in venueDoc) {
                                venueDoc[key] = req.body[key];
                            }
                        });
                        return venueDoc.save();
                    }
                    else {
                        throw venueNotFound(req.params.venueId);
                    }
                }).
                    then(venueDoc => next({ success: true, data: venueDoc })).
                    catch(err => next(err));
            }
        });
        venue.delete("/:venueId", async (req, res, next) => {
            venue_1.venueModel.findById(req.params.venueId).
                then(venueDoc => {
                if (venueDoc) {
                    return venueDoc.deleteOne({ includeResultMetadata: true }).exec();
                }
                else {
                    throw venueNotFound(req.params.venueId);
                }
            }).
                then((deleteResult) => {
                if (deleteResult && deleteResult.deletedCount > 0) {
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
