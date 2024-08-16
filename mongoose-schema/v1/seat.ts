import {
  Schema,
  model,
  Types,
  Model,
  HydratedDocument,
  QueryWithHelpers,
} from "mongoose";
import { ISection, venueModel } from "./venue";
import { names } from "../schema-names";
import { ReferentialError } from "../error";
export interface ICoord {
  sectX: number;
  sectY: number;
  orderInRow: number;
}
export const coordSchema = new Schema<ICoord>(
  {
    sectX: { type: Number, required: true },
    sectY: { type: Number, required: true },
    orderInRow: { type: Number, required: true },
  },
  { _id: false }
);
export interface ISeat {
  coord: ICoord;
  row: string;
  no: number;
  venueId: Types.ObjectId;
}
export interface ISeatMethod { }
interface HydratedSeat extends HydratedDocument<ISeat, ISeatMethod, SeatQueryHelpers> { }
interface SeatQueryHelpers {
  findByVenueId(
    venueId: string
  ): QueryWithHelpers<
    HydratedSeat[],
    HydratedSeat,
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
        validator: async function (val: ICoord) {
          let venue = await venueModel.findById(this.venueId);
          if (venue == null)
            throw new ReferentialError(`Venue with id ${this.venueId} doesn't exists.`);
          if (
            venue.sections.filter(
              (s: any) => s.x == val.sectX && s.y == val.sectY
            ).length == 0
          )
            throw new ReferentialError(
              `Venue with id ${this.venueId} doesn't contain section ${val.sectX}-${val.sectY}.`
            );
          return true;
        },
      },
    },
    row: { type: String, required: true },
    no: { type: Number, required: true },
    venueId: { type: Schema.Types.ObjectId, ref: names.Venue.singular_name, required: true },
  },
  {
    query: {
      findByVenueId(venueId: string) {
        let query = this as QueryWithHelpers<
          HydratedSeat[],
          HydratedSeat,
          SeatQueryHelpers
        >;
        return query.find({ venueId: new Types.ObjectId(venueId) });
      },
    },
  }
);
seatSchema.pre('updateOne', { document: false, query: true }, () => {
  throw new Error(
    "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
seatSchema.index({ venueId: 1, row: 1, no: 1 }, { unique: true });
export const seatModel = model<ISeat, SeatModel>(
  names.Seat.singular_name,
  seatSchema,
  names.Seat.collection_name
);
