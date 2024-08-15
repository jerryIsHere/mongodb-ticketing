import { Schema, model, Types, HydratedDocument, Model, CallbackWithoutResultAndOptionalError, FlatRecord, Document } from "mongoose";
import { ISeat, seatModel } from "./seat";
import { eventModel, IEvent } from "./event";
import { names } from "../schema-names";
import { ReferentialError } from "../error";
export interface ISection {
  x: number;
  y: number;
  options: any;
}
export const sectionSchema = new Schema<ISection>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    options: Schema.Types.Mixed,
  },
  { _id: false }
);

export interface IVenue {
  sections: ISection[];
  venuename: string;
}
export interface IVenueMethod {
  findOneSeatAssociate(): Promise<HydratedDocument<ISeat>>;
  findOneEventAssociate(): Promise<HydratedDocument<IEvent>>;
}
export interface VenueModel extends Model<IVenue, {}, IVenueMethod> { }
export const venueSchema = new Schema<IVenue, VenueModel, IVenueMethod>(
  {
    sections: { type: [sectionSchema], required: true },
    venuename: { type: String, required: true },
  },
  {
    methods: {
      async findOneSeatAssociate() {
        return await seatModel
          .findOne({
            venueId: this._id,
            $nor: this.sections.map((s) => {
              return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
            }),
          })
          .then();
      },
      async findOneEventAssociate() {
        return await eventModel.findOne({ venueId: this._id }).then();
      },
    },
  }
);
venueSchema.methods.findOneSeatAssociate = async function () {
  return await seatModel
    .findOne({
      venueId: this._id,
      $nor: this.sections.map((s) => {
        return { $and: [{ "coord.sectX": s.x }, { "coord.sectY": s.y }] };
      }),
    })
    .then();
};
venueSchema.methods.findOneEventAssociate = async function () {
  return await eventModel.findOne({ venueId: this._id }).then();
};

async function deleteReferentialIntegritycheck(this: Document<unknown, {}, FlatRecord<IVenue>> & Omit<FlatRecord<IVenue> & {
  _id: Types.ObjectId;
}, keyof IVenueMethod> & IVenueMethod, next: CallbackWithoutResultAndOptionalError) {
  const seat = await this.findOneSeatAssociate();
  if (seat != null) {
    next(
      new ReferentialError(
        `Deletation of ${this.constructor.name} with id ${this._id} failed ` +
        `as seat with id ${seat.id} depends on it.`
      )
    );
    return
  }
  const event = await this.findOneEventAssociate();
  console.log(event)
  if (event != null) {
    next(
      new ReferentialError(
        `Deletation of ${this.constructor.name} with id ${this._id} failed ` +
        `as event with id ${event.id} depends on it.`
      )
    );
    return
  }
  next();
}
venueSchema.pre("deleteOne", { document: true, query: false }, deleteReferentialIntegritycheck);
venueSchema.pre("findOneAndDelete", { document: true, query: false }, deleteReferentialIntegritycheck);
export const venueModel = model<IVenue, VenueModel>(names.Venue.singular_name, venueSchema, names.Venue.collection_name);
