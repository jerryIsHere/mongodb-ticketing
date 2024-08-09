
import { eventModel, IPriceTier, priceTierSchema } from './event';
import { Schema, model, Types, Model } from 'mongoose';
import { singular_name as Seat } from "./seat";
import { singular_name as Event } from "./event";
import { singular_name as User } from "./user";


// TODO put data in to purchase info and secure info
export interface ITicket {
    eventId: Types.ObjectId;
    seatId: Types.ObjectId;
    priceTier: IPriceTier;
    occupantId?: Types.ObjectId;
    securedBy?: Types.ObjectId;
    remark?: string;
    purchaseDate?: Date;
    confirmationDate?: Date;
}

export interface ITicketMethod {

}
export interface TicketModel extends Model<ITicket, {}, ITicketMethod> {

}
export const tickerSchema = new Schema<ITicket, TicketModel, ITicketMethod>({
    eventId: {
        type: Schema.Types.ObjectId, ref: Event, required: true,
        validate: {
            validator: async function (val: Types.ObjectId) {
                let event = await eventModel.findById(this.eventId)
                if (event == null)
                    throw new Error(`Event with id ${val} doesn't exists.`)
                return true
            },
        },
    },
    seatId: { type: Schema.Types.ObjectId, ref: Seat, required: true },
    securedBy: { type: Schema.Types.ObjectId, ref: User },
    priceTier: { type: priceTierSchema, required: true },
    occupantId: { type: Schema.Types.ObjectId, ref: User },
    remark: { type: String },
    purchaseDate: { type: Date },
    confirmationDate: { type: Date },
})
tickerSchema.index({eventId: 1, seatId: 1}, {unique: true})
export const collection_name = "tickets"
export const singular_name = "Ticket"
export const tickerModel = model<ITicket, TicketModel>(singular_name, tickerSchema, collection_name)
