import {
  Schema,
  model,
  Types,
  Model,
  HydratedDocument,
  QueryWithHelpers,
} from "mongoose";
import { ISection, singular_name as Venue, venueModel } from "./venue";
export interface Icoord {
  sectX: number;
  sectY: number;
  orderInRow: number;
}
export const coordSchema = new Schema<Icoord>(
  {
    sectX: { type: Number, required: true },
    sectY: { type: Number, required: true },
    orderInRow: { type: Number, required: true },
  },
  { _id: false }
);

export interface ISeat {
  coord: Icoord;
  row: string;
  no: number;
  venueId: Types.ObjectId;
}
export interface ISeatMethod {}
interface SeatQueryHelpers {
  findByVenueId(
    venueId: string
  ): QueryWithHelpers<
    HydratedDocument<ISeat>[],
    HydratedDocument<ISeat>,
    SeatQueryHelpers
  >;
}
export interface SeatModel extends Model<ISeat, SeatQueryHelpers, ISeatMethod> {
  listByVenueId(venueId: string): Promise<HydratedDocument<ISeat, ISeatMethod>>;
}
export const seatSchema = new Schema<
  ISeat,
  SeatModel,
  ISeatMethod,
  SeatQueryHelpers
>(
  {
    coord: {
      type: coordSchema,
      required: true,
      validate: {
        validator: async function (val: Icoord) {
          let venue = await venueModel.findById(this.venueId);
          if (venue == null)
            throw new Error(`Venue with id ${val} doesn't exists.`);
          if (
            venue.sections.filter(
              (s: any) => s.x == val.sectX && s.y == val.sectY
            ).length == 0
          )
            throw new Error(
              `Venue with id ${this.venueId} doesn't contain section ${val.sectX}-${val.sectY}.`
            );
          return true;
        },
      },
    },
    row: { type: String, required: true },
    no: { type: Number, required: true },
    venueId: { type: Schema.Types.ObjectId, ref: Venue, required: true },
  },
  {
    query: {
      findByVenueId(venueId: string) {
        let query = this as QueryWithHelpers<
          HydratedDocument<ISeat>[],
          HydratedDocument<ISeat>,
          SeatQueryHelpers
        >;
        return query.find({ venueId: new Schema.Types.ObjectId(venueId) });
      },
    },
  }
);
seatSchema.index({ venueId: 1, row: 1, no: 1 }, { unique: true });
export const collection_name = "seats";
export const singular_name = "Seat";
export const seatModel = model<ISeat, SeatModel>(
  singular_name,
  seatSchema,
  collection_name
);
