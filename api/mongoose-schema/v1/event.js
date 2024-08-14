"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventModel = exports.singular_name = exports.collection_name = exports.eventSchema = exports.priceTierSchema = exports.saleInfoSchema = void 0;
const mongoose_1 = require("mongoose");
const venue_1 = require("./venue");
const ticket_1 = require("./ticket");
const seat_1 = require("./seat");
exports.saleInfoSchema = new mongoose_1.Schema({
    start: {
        type: Date,
        required: true,
        validate: {
            validator: function (val) {
                return val < this.end;
            },
            message: "Sale end date must be after start date",
        },
    },
    end: { type: Date, required: true },
    ticketQuota: {
        type: Number,
        required: true,
        min: [Number.MIN_VALUE, "Quota(2nd round) must be greater than 0."],
    },
    buyX: {
        type: Number,
        required: true,
        min: [0, "Quota(2nd round) must be greater than or equal to 0."],
    },
    yFree: {
        type: Number,
        required: true,
        min: [0, "Quota(2nd round) must be greater than or equal to 0."],
    },
});
exports.priceTierSchema = new mongoose_1.Schema({
    tierName: { type: String, required: true },
    price: {
        type: Number,
        required: true,
        min: [0, "Price must be greater or equal then 0."],
    },
}, { _id: false });
exports.eventSchema = new mongoose_1.Schema({
    eventname: { type: String, required: true },
    datetime: { type: Date, required: true },
    duration: {
        type: Number,
        required: true,
        min: [Number.MIN_VALUE, "Duration must be greater than 0."],
    },
    shoppingCartSize: {
        type: Number,
        required: true,
        min: [Number.MIN_VALUE, "Cart size must be greater than 0."],
    },
    venueId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: venue_1.singular_name,
        required: true,
        validate: {
            validator: async (val) => (await venue_1.venueModel.findById(val).select({ _id: 1 }).lean()) != null,
            message: `${venue_1.singular_name} with id {VALUE} doesn't exists.`,
        },
    },
    priceTiers: {
        type: [exports.priceTierSchema],
        required: true,
        validate: {
            validator: (val) => val.length > 0,
            message: "At least one price tier should be provided.",
        },
    },
    saleInfos: {
        type: [exports.saleInfoSchema],
        required: true,
        validate: {
            validator: (val) => {
                if (val.length < 1)
                    throw new Error("At least one sale info should be provided.");
                // TODO: check that sale date is not overlapping
                if (false)
                    throw new Error("At least one sale info should be provided.");
                return true;
            },
        },
    },
}, {
    query: {
        findSelling() {
            let query = this;
            let now = new Date();
            return query.find({
                saleInfos: {
                    $elemMatch: {
                        $and: [{ start: { $lte: now } }, { end: { $gte: now } }],
                    },
                },
            });
        },
    },
});
exports.eventSchema.path("venueId").validate(async function (val) {
    let eventId = this.get("_id");
    let tickerFromOtherVenue = await ticket_1.ticketModel.aggregate([
        { $match: { eventId: eventId } },
        {
            $lookup: {
                from: seat_1.collection_name,
                localField: "seatId",
                foreignField: "_id",
                as: "seat",
            },
        },
        { $set: { seat: { $first: "$seat" } } },
        { $match: { "seat.venueId": { $ne: val } } },
    ]);
    if (tickerFromOtherVenue != null)
        throw new Error(`Update of ${exports.singular_name} with id ${eventId} failed ` +
            `as ticket with id ${tickerFromOtherVenue[0]._id} depends on another venue ${tickerFromOtherVenue[0].seat.venueId}.`);
    return true;
});
exports.collection_name = "events";
exports.singular_name = "Event";
exports.eventModel = (0, mongoose_1.model)(exports.singular_name, exports.eventSchema, exports.collection_name);
