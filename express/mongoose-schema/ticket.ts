
import { eventModel, IPriceTier, priceTierSchema } from './event';
import { Schema, model, Types, Model, Query, UpdateQuery } from 'mongoose';
import { singular_name as Seat, seatModel } from "./seat";
import { singular_name as Event } from "./event";
import { singular_name as User, userModel } from "./user";
export interface IPurchaseInfo {
    purchaseDate?: Date;
    purchaserId?: Types.ObjectId;
}

export interface IPaymentInfo {
    confirmedBy: Types.ObjectId;
    remark: string;
    confirmationDate: Date;

}
export interface ITicket {
    eventId: Types.ObjectId;
    seatId: Types.ObjectId;
    priceTier: IPriceTier;
    purchaseInfo?: IPurchaseInfo
    paymentInfo?: IPaymentInfo
}

export interface ITicketMethod {

}
export interface TicketModel extends Model<ITicket, {}, ITicketMethod> {
}
export const purchaseInfoSchema = new Schema<IPurchaseInfo>({
    purchaseDate: { type: Date, requried: true },
    purchaserId: {
        type: Schema.Types.ObjectId, ref: User,
        validate: {
            validator: async (val: Schema.Types.ObjectId) => {
                return (await userModel.findById(val)) != null
            },
            message: `${User} with id {VALUE} doesn't exists.`
        }
    },
})
export const paymentInfoSchema = new Schema<IPaymentInfo>({
    confirmedBy: {
        type: Schema.Types.ObjectId, ref: User, required: true,
        validate: {
            validator: async (val: Schema.Types.ObjectId) => {
                let confimer = await userModel.findById(val)
                if (confimer == null)
                    throw new Error(`${User} with id {VALUE} doesn't exists.`)
                if (!confimer._isAdmin && !confimer._isCustomerSupport)
                    throw new Error(`${User} with id {VALUE} do not have such permission.`)
                return true
            }
        }
    },
    remark: { type: String },
    confirmationDate: { type: Date, required: true, },
})
export const tickerSchema = new Schema<ITicket, TicketModel, ITicketMethod>({
    eventId: {
        type: Schema.Types.ObjectId, ref: Event, required: true,
        validate: {
            validator: async function (val: Types.ObjectId) {
                let event = await eventModel.findById(val)
                if (event == null)
                    throw new Error(`Event with id ${val} doesn't exists.`)
                let priceTier = event.priceTiers.find(p => p.tierName == this.priceTier.tierName)
                if(priceTier == undefined || priceTier.price != this.priceTier.price )
                    throw new Error(`Price tier ${this.priceTier.tierName} doesn't exists in associated event.`)
                return true
            },
        },
    },
    seatId: { type: Schema.Types.ObjectId, ref: Seat, required: true,
        validate: {
            validator: async function (val: Types.ObjectId) {
                let seat = await seatModel.findById(val)
                if (seat == null)
                    throw new Error(`Seat with id ${val} doesn't exists.`)
           
                return true
            },
        }, },
    priceTier: { type: priceTierSchema, required: true },
    purchaseInfo: { type: purchaseInfoSchema },
    paymentInfo: { type: paymentInfoSchema },

})
tickerSchema.index({ eventId: 1, seatId: 1 }, { unique: true })
tickerSchema.pre<Query<ITicket, TicketModel>>('updateMany', function (next) {
    const update = this.getUpdate() as UpdateQuery<TicketModel>;
    if (update && update.$set && update.$set.purchaseInfo) {
        
    }
    next();
});

export const collection_name = "tickets"
export const singular_name = "Ticket"
export const tickerModel = model<ITicket, TicketModel>(singular_name, tickerSchema, collection_name)
