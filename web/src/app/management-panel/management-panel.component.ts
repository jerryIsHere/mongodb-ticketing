import { Component, ViewChild, viewChild, } from '@angular/core';
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
  @ViewChild("soldTicketListComp") soldTicketListComp?: SoldTicketListComponent
  @ViewChild("eventListComp") eventListComp?: EventListComponent
  @ViewChild("venueListComp") venueListComp?: VenueListComponent
  @ViewChild("priceTierListComp") priceTierListComp?: PriceTierListComponent

  public dataListControls: { [name: string]: IDataListControl } = {
    priceTiers: {
      loadData: () => {
        return this.api.request.get("/priceTier?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.priceTiers = result.data
          if (this.priceTierListComp) this.priceTierListComp.loaded = true;
        })
      },
    },
    venues: {
      loadData: () => {
        return this.api.request.get("/venue?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.venues = result.data
          if (this.venueListComp) this.venueListComp.loaded = true;
        })
      },
    },
    events: {
      loadData: () => {
        return this.api.request.get("/event?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.events = result.data
          if (this.eventListComp) this.eventListComp.loaded = true;
        })
      },
    },
    soldTickets: {
      loadData: () => {
        return this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
          if (result && result.data)
            this.soldTickets = result.data
          if (this.soldTicketListComp) this.soldTicketListComp.loaded = true;
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