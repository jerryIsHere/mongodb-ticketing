import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PriceTierFormComponent } from '../forms/price-tier-form/price-tier-form.component';
import { VenueFormComponent } from '../forms/venue-form/venue-form.component';
import { EventFormComponent } from '../forms/event-form/event-form.component';
import { ComponentType } from '@angular/cdk/portal';
import { ApiService } from '../service/api.service';
import { RouterModule } from '@angular/router';

interface IDataListControl {
  component: ComponentType<unknown>
  loadData: () => Promise<any>,
  delete: (id: string) => Promise<any>,
}

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatCardModule, MatButtonModule, RouterModule],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.sass'
})
export class ManagementPanelComponent {
  public events: Event[] | null = null;
  public venues: Venue[] | null = null;
  public priceTiers: PriceTier[] | null = null;

  public dataListControls: { [name: string]: IDataListControl } = {
    priceTiers: {
      component: PriceTierFormComponent,
      loadData: () => {
        return this.api.request.get("/priceTier?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.priceTiers = result.data
        })
      },
      delete: (id: string) => {
        return this.api.request.delete(`/priceTier/${id}`).toPromise()
      }
    },
    venues: {
      component: VenueFormComponent,
      loadData: () => {
        return this.api.request.get("/venue?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.venues = result.data
        })
      },
      delete: (id: string) => {
        return this.api.request.delete(`/venue/${id}`).toPromise()
      }
    },
    events: {
      component: EventFormComponent,
      loadData: () => {
        return this.api.request.get("/event?list").toPromise().then((result: any) => {
          if (result && result.data)
            this.events = result.data
        })
      },
      delete: (id: string) => {
        return this.api.request.delete(`/event/${id}`).toPromise()
      }
    },
    // EventSeatFormComponent: {
    //   component: EventSeatFormComponent,
    //   loader: () => {

    //   }
    // },
  }




  constructor(public dialog: MatDialog, private api: ApiService) {
    for (let key in this.dataListControls) {
      this.dataListControls[key].loadData()
    }
  }
  openForm(dlc: IDataListControl, data: any = {}) {
    const dialogRef = this.dialog.open(dlc.component, {
      data: data
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      dlc.loadData()
    })


  }
  delete(dlc: IDataListControl, id: string) {
    dlc.delete(id).then(_ => dlc.loadData())
  }
}

export interface Event {
  eventname?: string;
  datetime?: Date;
  duration?: number;
  venueId?: string;
  venue?: Venue;
  _id?: string;
}
export interface Venue {
  venuename?: string;
  _id?: string;
}
export interface PriceTier {
  tierName?: string;
  price?: number;
  _id?: string;
}