import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { ShowListComponent } from './show-list/show-list.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { VenueSeatComponent } from './management-panel/venue-seat/venue-seat.component';
import { EventseatComponent } from './management-panel/eventseat/eventseat.component';
import { BuyTicketComponent } from './buy-ticket/buy-ticket.component';
import { MyticketComponent } from './myticket/myticket.component';
import { inject } from '@angular/core';
import { UserSessionService } from './service/user-session.service';
import { PaymentInfoComponent } from './payment-info/payment-info.component';
import { ProfileComponent } from './user/profile/profile.component';
import { VerifyComponent } from './user/verify/verify.component';
import { ResetPasswordComponent } from './user/reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', component: ShowListComponent },
    {
        path: 'management', component: ManagementPanelComponent, canActivate: [async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
            let userService = inject(UserSessionService)
            await userService.checkUserSession()
            if (userService.user?.hasAdminRight == true) {
                return true
            }
            else {
                inject(Router).navigate(['/'])
                return false
            }
        }]
    },
    { path: 'my-ticket', component: MyticketComponent },
    { path: 'venue-seats', component: VenueSeatComponent },
    { path: 'event-seats', component: EventseatComponent },
    { path: 'buy-ticket', component: BuyTicketComponent },
    { path: 'payment-info', component: PaymentInfoComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'verify/:token', component: VerifyComponent },
    { path: 'reset-password/:token', component: ResetPasswordComponent },
];
