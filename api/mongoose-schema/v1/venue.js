"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueModel = exports.venueSchema = exports.sectionSchema = void 0;
const mongoose_1 = require("mongoose");
const seat_1 = require("./seat");
const event_1 = require("./event");
const schema_names_1 = require("../schema-names");
const error_1 = require("../error");
exports.sectionSchema = new mongoose_1.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    options: mongoose_1.Schema.Types.Mixed,
}, { _id: false });
exports.venueSchema = new mongoose_1.Schema({
    sections: {
        type: [exports.sectionSchema], required: true,
        validate: {
            validator: async function (val) {
                let seatNotInSections = await seat_1.seatModel
                    .findOne({
                    venueId: this._id,
                    $nor: this.sections.map((s) => {
                        return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
                    }),
                })
                    .then();
                console.log(this, seatNotInSections);
                if (seatNotInSections == null) {
                    return true;
                }
                throw new error_1.ReferentialError(`This section update does not consider ` +
                    `${schema_names_1.names.Seat.singular_name} with id ${seatNotInSections.id} ` +
                    `(in section ${seatNotInSections.coord.sectX}-${seatNotInSections.coord.sectY}).`);
            }
        }
    },
    venuename: { type: String, required: true },
}, {
    methods: {
        async findOneSeatAssociate() {
            return await seat_1.seatModel.findOne({ venueId: this._id, }).then();
        },
        async findOneEventAssociate() {
            return await event_1.eventModel.findOne({ venueId: this._id }).then();
        },
    },
});
async function deleteReferentialIntegritycheck(next) {
    const seat = await this.findOneSeatAssociate();
    if (seat != null) {
        next(new error_1.ReferentialError(`Deletation of ${schema_names_1.names.Venue.singular_name} with id ${this._id} failed ` +
            `as seat with id ${seat.id} depends on it.`));
        return;
    }
    const event = await this.findOneEventAssociate();
    if (event != null) {
        next(new error_1.ReferentialError(`Deletation of ${schema_names_1.names.Venue.singular_name} with id ${this._id} failed ` +
            `as event with id ${event.id} depends on it.`));
        return;
    }
    next();
}
exports.venueSchema.pre('updateOne', { document: false, query: true }, () => {
    throw new Error("Please use find(ById) and chain save afterwards, as referential checking needs documents");
});
exports.venueSchema.pre("deleteOne", { document: true, query: false }, deleteReferentialIntegritycheck);
exports.venueSchema.pre("findOneAndDelete", () => {
    throw new Error("Please use find(ById) and chain delete afterwards, as referential checking needs " +
        "foreign key in document fields thus has to be executed in document middleware");
});
exports.venueModel = (0, mongoose_1.model)(schema_names_1.names.Venue.singular_name, exports.venueSchema, schema_names_1.names.Venue.collection_name);
