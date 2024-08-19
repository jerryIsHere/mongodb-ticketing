import mongoose, {
  Schema,
  model,
  Types,
  Model,
  HydratedDocument,
  QueryWithHelpers,
  Query,
  CallbackWithoutResultAndOptionalError,
  Document,
  FlatRecord,
} from "mongoose";
import { IVenue, venueModel } from "./venue";
import { ticketModel } from "./ticket";
import { names } from "../schema-names";
import { IPriceTier, priceTierSchema } from './priceTier';
import { ReferentialError, ValidationError } from "../error";

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
export interface IEventMethod { }
interface HydratedEvent extends HydratedDocument<IEvent, IEventMethod, EventQueryHelpers> { }
interface EventQueryHelpers {
  findSelling(): QueryWithHelpers<
    HydratedEvent[],
    HydratedEvent,
    EventQueryHelpers
  >;
}

export interface EventModel
  extends Model<IEvent, EventQueryHelpers, IEventMethod> { }
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
      ref: names.Venue.singular_name,
      required: true,
      validate: {
        validator: async (val: Schema.Types.ObjectId) =>
          (await venueModel.findById(val).select({ _id: 1 }).lean()) != null,
        message: `${names.Venue.singular_name} with id {VALUE} doesn't exists.`,
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
            throw new ValidationError("At least one sale info should be provided.");
          // TODO: check that sale date is not overlapping
          if (false)
            throw new ValidationError("At least one sale info should be provided.");
          return true;
        },
      },
    },
  },
  {
    query: {
      findSelling() {
        let query = this as QueryWithHelpers<
          HydratedEvent[],
          HydratedEvent,
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
eventSchema.virtual('venue', {
  ref: names.Venue.singular_name,
  localField: 'venueId',
  foreignField: '_id',
  justOne: true
})
eventSchema.pre('updateOne', { document: false, query: true }, () => {
  throw new Error(
    "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
eventSchema.path("venueId").validate(async function (val) {
  let eventId = this.get("_id");
  let tickerFromOtherVenue = await ticketModel.aggregate([
    { $match: { eventId: eventId } },
    {
      $lookup: {
        from: names.Seat.collection_name,
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
    throw new ReferentialError(
      `Update of ${names.Event.singular_name} with id ${eventId} failed ` +
      `as ticket with id ${tickerFromOtherVenue[0]._id} depends on another venue ${tickerFromOtherVenue[0].seat.venueId}.`
    );
  return true;
});
async function deleteReferentialIntegritycheck(this: Document<unknown, {}, FlatRecord<IEvent>> & Omit<FlatRecord<IEvent> & {
  _id: Types.ObjectId;
}, keyof IEventMethod> & IEventMethod, next: CallbackWithoutResultAndOptionalError) {
  const ticketCount = await ticketModel.find().findByEventId(this._id.toString()).countDocuments();
  if (ticketCount != null && ticketCount > 0) {
    next(
      new ReferentialError(
        `Deletation of ${names.Event.singular_name} with id ${this._id} failed ` +
        `as ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} depends on it.`
      )
    );
    return
  }
  next();
}
eventSchema.pre("deleteOne", { document: true, query: false }, deleteReferentialIntegritycheck);
export const eventModel: EventModel = (mongoose.models[names.Event.singular_name] as EventModel) || model<IEvent, EventModel>(
  names.Event.singular_name,
  eventSchema,
  names.Event.collection_name,
);
