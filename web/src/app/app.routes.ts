import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { ShowListComponent } from './show-list/show-list.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { VenueSeatComponent } from './management-panel/venue-seat/venue-seat.component';
import { EventseatComponent } from './management-panel/eventseat/eventseat.component';
import { BuyTicketComponent } from './customer/buy-ticket/buy-ticket.component';
import { MyticketComponent } from './customer/myticket/myticket.component';
import { EventPaymentComponent } from './customer/event-payment/event-payment.component';
import { inject } from '@angular/core';
import { UserSessionService } from './service/user-session.service';
import { PaymentInfoComponent } from './customer/payment-info/payment-info.component';
import { ProfileComponent } from './user/profile/profile.component';
import { VerifyComponent } from './user/verify/verify.component';
import { ResetPasswordComponent } from './user/reset-password/reset-password.component';
import { CustomerTicketComponent } from './management-panel/customer-ticket/customer-ticket.component';

let checkIsAdmin = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    let userService = inject(UserSessionService)
    await userService.checkUserSession()
    if (userService.user?.hasAdminRight == true) {
        return true
    }
    else {
        inject(Router).navigate(['/'])
        return false
    }
}

let checkIsLogined = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    let userService = inject(UserSessionService)
    await userService.checkUserSession()
    if (userService.user?._id) {
        return true
    }
    else {
        inject(Router).navigate(['/'])
        return false
    }
}

export const routes: Routes = [
    { path: '', component: ShowListComponent },
    { path: 'management', component: ManagementPanelComponent, canActivate: [checkIsAdmin] },
    { path: 'management/customer-ticket', component: CustomerTicketComponent, canActivate: [checkIsAdmin] },
    { path: 'my-ticket', component: MyticketComponent, canActivate: [checkIsLogined] },
    { path: 'event-payment', component: EventPaymentComponent, canActivate: [checkIsLogined] },
    { path: 'venue-seats', component: VenueSeatComponent, canActivate: [checkIsAdmin] },
    { path: 'event-seats', component: EventseatComponent, canActivate: [checkIsAdmin]  },
    { path: 'buy-ticket', component: BuyTicketComponent },
    { path: 'payment-info', component: PaymentInfoComponent },
    { path: 'profile', component: ProfileComponent , canActivate: [checkIsLogined] },
    { path: 'verify/:token', component: VerifyComponent },
    { path: 'reset-password/:token', component: ResetPasswordComponent },
];
