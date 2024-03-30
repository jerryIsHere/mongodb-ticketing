// refer to Event but named as Show to avoid name conflict with javascript html event
export interface Show {
    eventname?: string;
    datetime?: Date;
    duration?: number;
    venueId?: string;
    venue?: Venue;
    _id?: string;
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
    occupantId: string
    priceTier: PriceTier,
    occupied?: boolean
    occupant?: any
    _id: string
}