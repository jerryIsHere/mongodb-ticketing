"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceTierSchema = void 0;
const mongoose_1 = require("mongoose");
exports.priceTierSchema = new mongoose_1.Schema({
    tierName: { type: String, required: true },
    price: {
        type: Number,
        required: true,
        min: [0, "Price must be greater or equal then 0."],
    },
}, { _id: false });
