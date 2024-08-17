"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seatModel = exports.seatSchema = exports.coordSchema = void 0;
const mongoose_1 = require("mongoose");
const venue_1 = require("./venue");
const schema_names_1 = require("../schema-names");
const error_1 = require("../error");
exports.coordSchema = new mongoose_1.Schema({
    sectX: { type: Number, required: true },
    sectY: { type: Number, required: true },
    orderInRow: { type: Number, required: true },
}, { _id: false });
exports.seatSchema = new mongoose_1.Schema({
    coord: {
        type: exports.coordSchema,
        required: true,
        validate: {
            validator: async function (val) {
                let venue = await venue_1.venueModel.findById(this.venueId);
                if (venue == null)
                    throw new error_1.ReferentialError(`Venue with id ${this.venueId} doesn't exists.`);
                if (venue.sections.filter((s) => s.x == val.sectX && s.y == val.sectY).length == 0)
                    throw new error_1.ReferentialError(`Venue with id ${this.venueId} doesn't contain section ${val.sectX}-${val.sectY}.`);
                return true;
            },
        },
    },
    row: { type: String, required: true },
    no: { type: Number, required: true },
    venueId: { type: mongoose_1.Schema.Types.ObjectId, ref: schema_names_1.names.Venue.singular_name, required: true },
}, {
    query: {
        findByVenueId(venueId) {
            let query = this;
            return query.find({ venueId: new mongoose_1.Types.ObjectId(venueId) });
        },
    },
});
exports.seatSchema.virtual('venue', {
    ref: schema_names_1.names.Venue.singular_name,
    localField: 'venueId',
    foreignField: '_id',
    justOne: true
});
exports.seatSchema.pre('updateOne', { document: false, query: true }, () => {
    throw new Error("Please use find(ById) and chain save afterwards, as referential checking needs documents");
});
exports.seatSchema.index({ venueId: 1, row: 1, no: 1 }, { unique: true });
exports.seatModel = (0, mongoose_1.model)(schema_names_1.names.Seat.singular_name, exports.seatSchema, schema_names_1.names.Seat.collection_name);
