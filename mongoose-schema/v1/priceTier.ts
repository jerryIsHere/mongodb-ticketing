import { Schema } from "mongoose";

export interface IPriceTier {
    tierName: string;
    price: number;
}
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