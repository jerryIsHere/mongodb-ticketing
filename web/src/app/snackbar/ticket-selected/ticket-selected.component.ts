import { Component, Inject } from '@angular/core';
import { Ticket } from '../../interface';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../service/api.service';
import { Router } from '@angular/router';

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
      tickets: Ticket[],
      limit: number,
      rowNcol?: string[],
    }, private api: ApiService, private router: Router,) {
    this.limit = data.limit;
    router.events.subscribe((_) => {
      snackRef.dismiss()
    })
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
          this.router.navigate(['payment-info'], { queryParams: { ids: result.data.map((ticket: Ticket) => ticket._id) } })
        }
      }).then(result => {
        this.snackRef.dismiss();
      })
      this.doing = true
    }
  }
  doing: boolean = false;
}
