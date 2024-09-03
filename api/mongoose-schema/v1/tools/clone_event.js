"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("../../schema");
const database_1 = require("../../../server/database/database");
const event_1 = require("../event");
const ticket_1 = require("../ticket");
Promise.all([database_1.Database.init()])
    .catch(e => {
    console.error(e);
})
    .finally(async () => {
    // update search condition here!
    await schema_1.v1.Event.eventModel.findOne({ eventname: "test" }).then(async (oriEvent) => {
        if (oriEvent) {
            console.log(`cloning ${oriEvent.eventname} `);
            let cloneEvent = new event_1.eventModel({ ...oriEvent.toJSON(), ...{ _id: undefined } });
            cloneEvent.eventname = `${cloneEvent.eventname} clone`;
            let doc = await schema_1.v1.Event.eventModel.findOne({ eventname: cloneEvent.eventname }).exec();
            if (doc) {
                throw new Error("cloning is done before");
            }
            await cloneEvent.save();
            schema_1.v1.Ticket.ticketModel.find({
                eventId: oriEvent._id,
            }).then(async (oriTicket) => {
                for (let ticket of oriTicket) {
                    let cloneTicket = new ticket_1.ticketModel({
                        ...ticket.toJSON(), ...{
                            _id: undefined,
                            purchaseInfo: undefined,
                            paymentInfo: undefined
                        }
                    });
                    cloneTicket.eventId = cloneEvent._id;
                    await cloneTicket.save();
                }
                return;
            });
        }
        else {
            throw new Error("no event found");
        }
    });
});
