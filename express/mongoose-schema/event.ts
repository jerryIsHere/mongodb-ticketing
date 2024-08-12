import {
  Schema,
  model,
  Types,
  Model,
  HydratedDocument,
  QueryWithHelpers,
  Query,
} from "mongoose";
import { IVenue, singular_name as Venue, venueModel } from "./venue";
import { ticketModel } from "./ticket";
import { collection_name as seat_collection__name } from "./seat";
export interface IPriceTier {
  tierName: string;
  price: number;
}

export interface ISaleInfo {
  start: Date;
  end: Date;
  ticketQuota: number;
  buyX: number;
  yFree: number;
}
export interface IEvent {
  eventname: string;
  datetime: Date;
  duration: number;
  shoppingCartSize: number;
  venueId: Types.ObjectId;
  priceTiers: IPriceTier[];
  saleInfos: ISaleInfo[];
}
export interface IEventMethod {}
interface EventQueryHelpers {
  findSelling(): QueryWithHelpers<
    HydratedDocument<IEvent>[],
    HydratedDocument<IEvent>,
    EventQueryHelpers
  >;
}

export interface EventModel
  extends Model<IEvent, EventQueryHelpers, IEventMethod> {}
export const saleInfoSchema = new Schema<ISaleInfo>({
  start: {
    type: Date,
    required: true,
    validate: {
      validator: function (val: Date) {
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
export const priceTierSchema = new Schema<IPriceTier>(
  {
    tierName: { type: String, required: true },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be greater or equal then 0."],
    },
  },
  { _id: false }
);
export const eventSchema = new Schema<
  IEvent,
  EventModel,
  IEventMethod,
  EventQueryHelpers
>(
  {
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
      type: Schema.Types.ObjectId,
      ref: Venue,
      required: true,
      validate: {
        validator: async (val: Schema.Types.ObjectId) =>
          (await venueModel.findById(val)) != null,
        message: `${Venue} with id {VALUE} doesn't exists.`,
      },
    },
    priceTiers: {
      type: [priceTierSchema],
      required: true,
      validate: {
        validator: (val: IPriceTier[]) => val.length > 0,
        message: "At least one price tier should be provided.",
      },
    },
    saleInfos: {
      type: [saleInfoSchema],
      required: true,
      validate: {
        validator: (val: ISaleInfo[]) => {
          if (val.length < 1)
            throw new Error("At least one sale info should be provided.");
          // TODO: check that sale date is not overlapping
          if (false)
            throw new Error("At least one sale info should be provided.");
          return true;
        },
      },
    },
  },
  {
    query: {
      findSelling() {
        let query = this as QueryWithHelpers<
          HydratedDocument<IEvent>[],
          HydratedDocument<IEvent>,
          EventQueryHelpers
        >;
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
  }
);
eventSchema.path("venueId").validate(async function (val) {
  let eventId = this.get("_id");
  let tickerFromOtherVenue = await ticketModel.aggregate([
    { $match: { eventId: eventId } },
    {
      $lookup: {
        from: seat_collection__name,
        localField: "seatId",
        foreignField: "_id",
        as: "seat",
      },
    },
    { $set: { seat: { $first: "$seat" } } },
    { $match: { "seat.venueId": { $ne: val } } },
  ]);
  if (tickerFromOtherVenue != null)
    throw new Error(
      `Update of ${singular_name} with id ${eventId} failed ` +
        `as ticket with id ${tickerFromOtherVenue[0]._id} depends on another venue ${tickerFromOtherVenue[0].seat.venueId}.`
    );
  return true;
});
export const collection_name = "events";
export const singular_name = "Event";
export const eventModel: EventModel = model<IEvent, EventModel>(
  singular_name,
  eventSchema,
  collection_name
);
