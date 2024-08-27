"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("../../schema");
const database_1 = require("../../../server/database/database");
const venue_1 = require("../venue");
const seat_1 = require("../seat");
Promise.all([database_1.Database.init()])
    .catch(e => {
    console.error(e);
})
    .finally(async () => {
    let venueName = "CityHall Concert Hall";
    let sections = [
        { x: 1, y: 1, options: {} },
        { x: 1, y: 2, options: {} },
        { x: 1, y: 3, options: {} },
        { x: 2, y: 1, options: {} },
        { x: 2, y: 2, options: {} },
        { x: 2, y: 3, options: {} }
    ];
    console.log(`cloning ${venueName} with`);
    await schema_1.v1.Venue.venueModel.findOne({ venuename: venueName }).then(async (oriVenue) => {
        if (oriVenue) {
            let filteredSections = oriVenue.sections.filter(s => sections.find(ss => ss.x == s.x && ss.y == s.y));
            let cloneVenue = new venue_1.venueModel({ ...oriVenue.toJSON(), ...{ _id: undefined, sections: filteredSections } });
            console.log(cloneVenue.sections.map(s => `${s.x}-${s.y}`).join(', '));
            cloneVenue.venuename = `${venueName} without balcony`;
            await cloneVenue.save();
            schema_1.v1.Seat.seatModel.find({
                venueId: oriVenue._id,
                $or: sections.map(s => {
                    return { "coord.sectX": s.x, "coord.sectY": s.y };
                })
            }).then(async (oriSeat) => {
                oriSeat;
                for (let seat of oriSeat) {
                    let cloneSeat = new seat_1.seatModel({ ...seat.toJSON(), ...{ _id: undefined } });
                    cloneSeat.venueId = cloneVenue._id;
                    await cloneSeat.save();
                }
            });
        }
    });
});
