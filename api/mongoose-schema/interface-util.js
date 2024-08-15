"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaserIfAny = exports.ticketPurchaseDateString = exports.ticketConfirmDateString = exports.showSellingString = exports.getSellingInfo = exports.isShowSellingInThisRound = exports.isShowSelling = void 0;
function isShowSelling(show) {
    return show.saleInfos.filter(info => isShowSellingInThisRound(info)).length > 1;
}
exports.isShowSelling = isShowSelling;
function isShowSellingInThisRound(saleInfo) {
    let now = new Date();
    return (saleInfo.start && new Date(saleInfo.start) <= now && saleInfo.end && new Date(saleInfo.end) >= now);
}
exports.isShowSellingInThisRound = isShowSellingInThisRound;
function getSellingInfo(show) {
    return show.saleInfos.find(s => isShowSellingInThisRound(s));
}
exports.getSellingInfo = getSellingInfo;
function showSellingString(saleInfos) {
    return saleInfos.
        map(info => `${new Date(info.start).toLocaleDateString()}-${new Date(info.end).toLocaleDateString()}`).
        join("\n");
}
exports.showSellingString = showSellingString;
function ticketConfirmDateString(ticket) {
    return ticket.paymentInfo ? 'Ticket confirmed at ' + new Date(ticket.paymentInfo.confirmationDate).toLocaleDateString() : '';
}
exports.ticketConfirmDateString = ticketConfirmDateString;
function ticketPurchaseDateString(ticket) {
    return ticket.purchaseInfo ? new Date(ticket.purchaseInfo.purchaseDate).toLocaleDateString() : '';
}
exports.ticketPurchaseDateString = ticketPurchaseDateString;
function getPurchaserIfAny(ticket) {
    return "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser : "purchased" in ticket ? ticket.purchased : null;
}
exports.getPurchaserIfAny = getPurchaserIfAny;
