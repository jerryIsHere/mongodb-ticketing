// refer to Event of backend logic but renamed to Show to avoid name conflict with browser event javascript object
export interface Show {
    eventname?: string;
    datetime?: Date;
    duration?: number;
    venueId?: string;
    venue?: Venue;
    _id?: string;
    startSellDate?: Date;
    endSellDate?: Date
}
export interface Venue {
    venuename?: string;
    sections?: { x: number, y: number }[]
    _id?: string;
}
export interface PriceTier {
    tierName?: string;
    price?: number;
    _id?: string;
}
export interface Seat {
    row: string
    no: number
    venueId: string
    _id: string
    coord: { orderInRow: number, sectX: number, sectY: number }
}
export interface Ticket {
    eventId: string,
    seatId: string,
    priceTierId: string,
    occupantId: string | null,
    priceTier: PriceTier,
    seat?: Seat,
    event?: Show,
    occupied?: boolean,
    occupant?: any,
    _id: string,
    paid?: boolean | null,
    paymentRemark?: string | null,
}