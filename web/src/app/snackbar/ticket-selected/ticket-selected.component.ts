import { Component, Inject } from '@angular/core';
import { PriceTier } from '../../management-panel/management-panel.component';
import { Seat } from '../../seatUI/seating-plan/seating-plan.component';
import { Ticket } from '../../seatUI/seating-plan/seating-plan.component'
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-seat-selected',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './ticket-selected.component.html',
  styleUrl: './ticket-selected.component.sass'
})
export class TicketSelectedComponent {
  constructor(
    public snackRef: MatSnackBarRef<TicketSelectedComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: {
      tickets: Ticket[],
    }, private api: ApiService,) {
    this.data.tickets = this.data.tickets.filter(t => t.occupant == null || t.occupant == undefined || t.occupied)
  }
  totalCost() {

    return this.data.tickets.reduce<number>((cost, ticket) => { return cost += !Number.isNaN(Number(ticket.priceTier.price)) ? Number(ticket.priceTier.price) : 0 }, 0)
  }
  buy() {
    if (this.data.tickets.length > 0) {
      this.api.request.patch(`/ticket?batch&buy`, {
        ticketIds: this.data.tickets.map(t => t._id)
      },).toPromise().then((result: any) => {
        if (result && result.success) {
        }
      }).then(_ => {
        this.snackRef.dismiss();
      })
      this.doing = true
    }
  }
  doing: boolean = false;
}
