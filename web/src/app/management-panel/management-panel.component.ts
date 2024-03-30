import { Component, } from '@angular/core';
import { Show, Venue, PriceTier, Ticket } from '../interface'
import { EventListComponent } from './event-list/event-list.component';
import { VenueListComponent } from './venue-list/venue-list.component';
import { PriceTierListComponent } from './price-tier-list/price-tier-list.component';
import { SoldTicketListComponent } from './sold-ticket-list/sold-ticket-list.component';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../service/api.service';

interface IDataListControl {
  loadData: () => Promise<any>,
}

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [EventListComponent, VenueListComponent, PriceTierListComponent, SoldTicketListComponent, MatCardModule],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.sass'
})
export class ManagementPanelComponent {
  public events: Show[] = [];
  public venues: Venue[] = [];
  public priceTiers: PriceTier[] = [];
  public soldTickets: Ticket[] = [];

  public dataListControls: { [name: string]: IDataListControl } = {
    priceTiers: {
      loadData: () => {
        return this.api.request.get("/priceTier?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.priceTiers = result.data
        })
      },
    },
    venues: {
      loadData: () => {
        return this.api.request.get("/venue?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.venues = result.data
        })
      },
    },
    events: {
      loadData: () => {
        return this.api.request.get("/event?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.events = result.data
        })
      },
    },
    soldTickets: {
      loadData: () => {
        return this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
          if (result && result.data)
            this.soldTickets = result.data
        })
      },
    },
  }
  constructor(private api: ApiService) {
    for (let key in this.dataListControls) {
      this.dataListControls[key].loadData()
    }
  }
}