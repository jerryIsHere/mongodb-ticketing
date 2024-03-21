import { Routes } from '@angular/router';
import { ShowListComponent } from './show-list/show-list.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { TicketingComponent } from './ticketing/ticketing.component';
import { VenueSeatComponent } from './venue-seat/venue-seat.component';
import { EventseatComponent } from './eventseat/eventseat.component';

export const routes: Routes = [
    { path: '', component: ShowListComponent },
    { path: 'management', component: ManagementPanelComponent },
    { path: 'myticket', component: TicketingComponent },
    { path: 'venue-seats', component: VenueSeatComponent },
    { path: 'event-seats', component: EventseatComponent },
];
