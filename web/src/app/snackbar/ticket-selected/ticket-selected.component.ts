import { Component, Inject } from '@angular/core';
import { TicketAPIObject } from '../../../../../mongoose-schema/interface_util';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../service/api.service';
import { Router } from '@angular/router';
import { UserSessionService } from '../../service/user-session.service';

@Component({
  selector: 'app-seat-selected',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './ticket-selected.component.html',
  styleUrl: './ticket-selected.component.sass'
})
export class TicketSelectedComponent {
  limit: number
  constructor(
    public snackRef: MatSnackBarRef<TicketSelectedComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: {
      tickets: TicketAPIObject[],
      limit: number,
      seatInfo?: string[],
      success: boolean,
      reload: boolean,
    }, private api: ApiService, private router: Router, private userSession: UserSessionService) {
    this.limit = data.limit;
    router.events.subscribe((_) => {
      snackRef.dismiss()
    })
    this.data.tickets = this.data.tickets.filter(t => !("purchaseInfo" in t))
  }
  totalCost() {

    return this.data.tickets.reduce<number>((cost, ticket) => { return cost += !Number.isNaN(Number(ticket.priceTier.price)) ? Number(ticket.priceTier.price) : 0 }, 0)
  }
  buy() {
    if (this.data.tickets.length > 0) {
      this.api.request.patch(`/ticket?batch&buy`, {
        ticketIds: this.data.tickets.map(t => t._id)
      }, {}, { showSuccessHandler: false }).toPromise().then((result: any) => {
        if (result && result.success) {
          this.router.navigate(['payment-info'], { queryParams: { ids: result.data.map((ticket: TicketAPIObject) => ticket._id), userId: this.userSession.user._id } })
        }
      }).then(result => {
        this.snackRef.dismiss();
      }).catch(errResponse => {
        console.log(errResponse)
        let isReasonOccupied = (reason: string) => reason.includes("is not avaliable")
        if (errResponse.error) {
          if (errResponse.error.reason) {
            if (isReasonOccupied(errResponse.error.reason))
              this.data.reload = true

          }
          else if (errResponse.error.reasons) {
            if (errResponse.error.reasons.findIndex(isReasonOccupied) > -1)
              this.data.reload = true
          }
        }
      })
    }
    this.doing = true
  }

  doing: boolean = false;
}
