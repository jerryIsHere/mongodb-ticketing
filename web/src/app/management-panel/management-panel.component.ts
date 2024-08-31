import { Component, ViewChild, viewChild, } from '@angular/core';
import { ShowAPIObject, VenueAPIObject, IPriceTier, TicketAPIObject, UserAPIObject, AdminTicketAPIObject } from '../api-util'
import { EventListComponent } from './event-list/event-list.component';
import { MatDialog } from '@angular/material/dialog';
import { VenueListComponent } from './venue-list/venue-list.component';
import { SoldTicketListComponent } from './sold-ticket-list/sold-ticket-list.component';
import { RegisterFormComponent } from '../user/register-form/register-form.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ApiService } from '../service/api.service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import dateFormat from 'dateformat';

interface IDataListControl {
  loadData: () => Promise<any>,
}

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [EventListComponent, RegisterFormComponent, VenueListComponent, SoldTicketListComponent, MatCardModule,
    MatButtonModule, RouterModule, MatIconModule],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.sass'
})
export class ManagementPanelComponent {
  public events: ShowAPIObject[] = [];
  public venues: VenueAPIObject[] = [];
  public priceTiers: IPriceTier[] = [];
  public soldTickets: TicketAPIObject[] = [];
  @ViewChild("soldTicketListComp") soldTicketListComp?: SoldTicketListComponent
  @ViewChild("eventListComp") eventListComp?: EventListComponent
  @ViewChild("venueListComp") venueListComp?: VenueListComponent

  public dataListControls: { [name: string]: IDataListControl } = {
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
        return Promise.resolve([])
        this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
          if (result && result.data)
            this.soldTickets = result.data
          if (this.soldTicketListComp) this.soldTicketListComp.loaded = true;
        })
      },
    },
  }
  constructor(private api: ApiService, public dialog: MatDialog) {
    for (let key in this.dataListControls) {
      this.dataListControls[key].loadData()
    }
  }
  createUser() {
    const dialogRef = this.dialog.open(RegisterFormComponent);
  }
  ChangePassword() {
    const dialogRef = this.dialog.open(ChangePasswordComponent);
  }

  downloadUserDataCSV() {
    this.api.request.get("/user?list&lastPurchaseTicket").toPromise().then((result: any) => {
      var data = "data:text/csv;charset=utf-8," +
        [
          ["_id", "username", "fullname", "email", "singingPart", "lastLoginDate", "latestTicketPurchaseDate", "latestTicketConfirmDate", "latestTicketConfirmationType",
            "latestTicketRemark",].join(","),
          ...result.data.map((user: UserAPIObject & {lastPurchaseTicket : AdminTicketAPIObject}) => {
            return [
              user._id,
              user.username,
              user.fullname,
              user.email,
              user.singingPart,
              user.lastLoginDate ? dateFormat(new Date(user.lastLoginDate), 'yyyymmdd hhmmss') : '',
              user.lastPurchaseTicket ? user.lastPurchaseTicket.purchaseInfo ? dateFormat(new Date(user.lastPurchaseTicket.purchaseInfo.purchaseDate), 'yyyymmdd hhmmss') : '' : '',
              user.lastPurchaseTicket ? user.lastPurchaseTicket.paymentInfo ? dateFormat(new Date(user.lastPurchaseTicket.paymentInfo.confirmationDate), 'yyyymmdd hhmmss') : '' : '',
              user.lastPurchaseTicket ? user.lastPurchaseTicket.paymentInfo?.confirmedBy : '',
              user.lastPurchaseTicket ? user.lastPurchaseTicket.paymentInfo?.remark : '',

            ].map(value => value ? value : '').join(",")
          }
          )
        ].join("\n")

      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(data));
      link.setAttribute("download", `user-${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
    })
  }
}