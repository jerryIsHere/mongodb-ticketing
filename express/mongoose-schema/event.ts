import { Schema, model, Types, Model, HydratedDocument } from 'mongoose';
import { IVenue, singular_name as Venue, venueModel } from "./venue";
export interface IPriceTier {
    tierName: string;
    price: number;
}
export interface IEvent {
    eventname: string;
    datetime: Date;
    startFirstRoundSellDate: Date;
    endFirstRoundSellDate: Date;
    startSecondRoundSellDate: Date;
    endSecondRoundSellDate: Date;
    duration: number;
    shoppingCartSize: number;
    firstRoundTicketQuota: number;
    secondRoundTicketQuota: number;
    venueId: Types.ObjectId;
    priceTiers: IPriceTier[];
}
export interface IEventMethod {

}
export interface EventModel extends Model<IEvent, {}, IEventMethod> {
    listAll(): Promise<HydratedDocument<IEvent, IEventMethod>[]>
    listSelling(): Promise<HydratedDocument<IEvent, IEventMethod>[]>
}
export const priceTierSchema = new Schema<IPriceTier>(
    {
        tierName: { type: String, required: true },
        price: {
            type: Number, required: true,
            min: [0, 'Price must be greater or equal then 0.']
        },
    },
    { _id: false }
)
export const eventSchema =
    new Schema<IEvent, EventModel, IEventMethod>({
        eventname: { type: String, required: true },
        datetime: { type: Date, required: true },
        startFirstRoundSellDate: { type: Date, required: true },
        endFirstRoundSellDate: { type: Date, required: true },
        startSecondRoundSellDate: { type: Date, required: true },
        endSecondRoundSellDate: { type: Date, required: true },
        duration: {
            type: Number, required: true,
            min: [Number.MIN_VALUE, 'Duration must be greater then 0.']
        },
        shoppingCartSize: {
            type: Number, required: true,
            min: [Number.MIN_VALUE, 'Cart size must be greater then 0.']
        },
        firstRoundTicketQuota: {
            type: Number, required: true,
            min: [Number.MIN_VALUE, 'Quota(2nd round) must be greater then 0.']
        },
        secondRoundTicketQuota: {
            type: Number, required: true,
            min: [Number.MIN_VALUE, 'Quota(2nd round) must be greater then 0.']
        },
        venueId: {
            type: Schema.Types.ObjectId, ref: Venue, required: true,
            validate: {
                validator: async (val: Schema.Types.ObjectId) => {
                    return (await venueModel.findById(val)) != null
                },
                message: `${Venue} with id {VALUE} doesn't exists.`
            }
        },
        priceTiers: {
            type: [priceTierSchema], required: true,
            validate: {
                validator: (val: IPriceTier[]) => val.length > 0,
                message: 'At least one price tier should be provided.'
            }
        },
    }, {
        statics: {
            async listSelling() {
                let selling = this.aggregate([
                    {
                        $match: {
                            $or: [
                                {
                                    $and: [
                                        { startFirstRoundSellDate: { $lte: new Date() } },
                                        { endFirstRoundSellDate: { $gte: new Date() } },
                                    ]
                                },
                                {
                                    $and: [
                                        { startSecondRoundSellDate: { $lte: new Date() } },
                                        { endSecondRoundSellDate: { $gte: new Date() } },
                                    ]
                                },
                            ]
                        }
                    },
                ])
            }
        }
    })
export const collection_name = "events"
export const singular_name = "Event"
export const eventModel = model<IEvent, EventModel>(singular_name, eventSchema, collection_name)
