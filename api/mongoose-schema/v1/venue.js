"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueModel = exports.singular_name = exports.collection_name = exports.venueSchema = exports.sectionSchema = void 0;
const mongoose_1 = require("mongoose");
const seat_1 = require("./seat");
const event_1 = require("./event");
exports.sectionSchema = new mongoose_1.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    options: mongoose_1.Schema.Types.Mixed,
}, { _id: false });
exports.venueSchema = new mongoose_1.Schema({
    sections: { type: [exports.sectionSchema], required: true },
    venuename: { type: String, required: true },
}, {
    methods: {
        async findOneSeatAssociate() {
            return await seat_1.seatModel
                .findOne({
                venueId: this._id,
                $nor: this.sections.map((s) => {
                    return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
                }),
            })
                .then();
        },
        async findOneEventAssociate() {
            return await event_1.eventModel.findOne({ venueId: this._id }).then();
        },
    },
});
exports.venueSchema.methods.findOneSeatAssociate = async function () {
    return await seat_1.seatModel
        .findOne({
        venueId: this._id,
        $nor: this.sections.map((s) => {
            return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
        }),
    })
        .then();
};
exports.venueSchema.methods.findOneEventAssociate = async function () {
    return await event_1.eventModel.findOne({ venueId: this._id }).then();
};
exports.venueSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    this;
    //referential integrity checks
    const seat = await this.findOneSeatAssociate();
    if (seat != null)
        next(new Error(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
            `as seat with id ${seat.id} depends on it.`));
    const event = await this.findOneEventAssociate();
    if (event != null)
        next(new Error(`Deletation of ${this.constructor.name} with id ${this._id} failed ` +
            `as event with id ${event.id} depends on it.`));
    next();
});
exports.collection_name = "venues";
exports.singular_name = "Venue";
exports.venueModel = (0, mongoose_1.model)(exports.singular_name, exports.venueSchema);
