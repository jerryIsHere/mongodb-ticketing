"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventModel = exports.eventSchema = exports.saleInfoSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const venue_1 = require("./venue");
const ticket_1 = require("./ticket");
const schema_names_1 = require("../schema-names");
const priceTier_1 = require("./priceTier");
const error_1 = require("../error");
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
        min: [-1, "Quota must be greater than or equao to -1."],
    },
    buyX: {
        type: Number,
        required: true,
        min: [0, "Quota must be greater than or equal to 0."],
    },
    yFree: {
        type: Number,
        required: true,
        min: [0, "Quota must be greater than or equal to 0."],
    },
});
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
        ref: schema_names_1.names.Venue.singular_name,
        required: true,
        validate: {
            validator: async (val) => (await venue_1.venueModel.findById(val).select({ _id: 1 }).lean()) != null,
            message: `${schema_names_1.names.Venue.singular_name} with id {VALUE} doesn't exists.`,
        },
    },
    priceTiers: {
        type: [priceTier_1.priceTierSchema],
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
                    throw new error_1.ValidationError("At least one sale info should be provided.");
                // TODO: check that sale date is not overlapping
                if (false)
                    throw new error_1.ValidationError("At least one sale info should be provided.");
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
exports.eventSchema.virtual('venue', {
    ref: schema_names_1.names.Venue.singular_name,
    localField: 'venueId',
    foreignField: '_id',
    justOne: true
});
exports.eventSchema.pre('updateOne', { document: false, query: true }, () => {
    throw new Error("Please use find(ById) and chain save afterwards, as referential checking needs documents");
});
exports.eventSchema.path("venueId").validate(async function (val) {
    let eventId = this.get("_id");
    let tickerFromOtherVenue = await ticket_1.ticketModel.aggregate([
        { $match: { eventId: eventId } },
        {
            $lookup: {
                from: schema_names_1.names.Seat.collection_name,
                localField: "seatId",
                foreignField: "_id",
                as: "seat",
            },
        },
        { $set: { seat: { $first: "$seat" } } },
        { $match: { "seat.venueId": { $ne: val } } },
        { $limit: 1 },
    ]);
    if (tickerFromOtherVenue != null && tickerFromOtherVenue.length > 0)
        throw new error_1.ReferentialError(`Update of ${schema_names_1.names.Event.singular_name} with id ${eventId} failed ` +
            `as ticket with id ${tickerFromOtherVenue[0]._id} depends on another venue ${tickerFromOtherVenue[0].seat.venueId}.`);
    return true;
});
async function deleteReferentialIntegritycheck(next) {
    const ticketCount = await ticket_1.ticketModel.find().findByEventId(this._id.toString()).countDocuments();
    if (ticketCount != null && ticketCount > 0) {
        next(new error_1.ReferentialError(`Deletation of ${schema_names_1.names.Event.singular_name} with id ${this._id} failed ` +
            `as ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} depends on it.`));
        return;
    }
    next();
}
exports.eventSchema.pre("deleteOne", { document: true, query: false }, deleteReferentialIntegritycheck);
exports.eventModel = mongoose_1.default.models[schema_names_1.names.Event.singular_name] || (0, mongoose_1.model)(schema_names_1.names.Event.singular_name, exports.eventSchema, schema_names_1.names.Event.collection_name);
