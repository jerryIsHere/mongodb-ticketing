"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1 = void 0;
const V1Event = __importStar(require("./v1/event"));
const V1Notification = __importStar(require("./v1/notification"));
const V1Seat = __importStar(require("./v1/seat"));
const V1Ticket = __importStar(require("./v1/ticket"));
const V1User = __importStar(require("./v1/user"));
const V1Venue = __importStar(require("./v1/venue"));
exports.v1 = {
    Event: V1Event,
    Notification: V1Notification,
    Seat: V1Seat,
    Ticket: V1Ticket,
    User: V1User,
    Venue: V1Venue
};
