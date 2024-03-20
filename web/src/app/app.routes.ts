import { Routes } from '@angular/router';
import { ShowListComponent } from './show-list/show-list.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { TicketingComponent } from './ticketing/ticketing.component';

export const routes: Routes = [
    { path: '', component: ShowListComponent },
    { path: '/management', component: ManagementPanelComponent },
    { path: '/myticket', component: TicketingComponent },
];
