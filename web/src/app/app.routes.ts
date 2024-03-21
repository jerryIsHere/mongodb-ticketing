import { Routes } from '@angular/router';
import { ShowListComponent } from './show-list/show-list.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { VenueSeatComponent } from './venue-seat/venue-seat.component';
import { EventseatComponent } from './eventseat/eventseat.component';
import { BuyTicketComponent } from './buy-ticket/buy-ticket.component';
import { MyticketComponent } from './myticket/myticket.component';

export const routes: Routes = [
    { path: '', component: ShowListComponent },
    { path: 'management', component: ManagementPanelComponent },
    { path: 'my-ticket', component: MyticketComponent },
    { path: 'venue-seats', component: VenueSeatComponent },
    { path: 'event-seats', component: EventseatComponent },
    { path: 'buy-ticket', component: BuyTicketComponent },
];
