import { Schema, model, Types, HydratedDocument, Model } from "mongoose";
import { ISeat, seatModel } from "./seat";
import { eventModel, IEvent } from "./event";
import { names } from "../schema-names";
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

venueSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    this;
    //referential integrity checks
    const seat = await this.findOneSeatAssociate();
    if (seat != null)
      next(
        new Error(
          `Deletation of ${this.constructor.name} with id ${this._id} failed ` +
          `as seat with id ${seat.id} depends on it.`
        )
      );
    const event = await this.findOneEventAssociate();
    if (event != null)
      next(
        new Error(
          `Deletation of ${this.constructor.name} with id ${this._id} failed ` +
          `as event with id ${event.id} depends on it.`
        )
      );
    next();
  }
);
export const venueModel = model<IVenue, VenueModel>(names.Venue.singular_name, venueSchema, names.Venue.collection_name);
