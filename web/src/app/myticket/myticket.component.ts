import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Event, PriceTier } from '../management-panel/management-panel.component'
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-myticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule],
  templateUrl: './myticket.component.html',
  styleUrl: './myticket.component.sass'
})
export class MyticketComponent {
  public tickets: Ticket[] | null = null;
  constructor(private api: ApiService) {
    this.loadData()
  }
  loadData() {
    return this.api.request.get("/ticket?my").toPromise().then((result: any) => {
      if (result && result.data)
        this.tickets = result.data
    })
  }

}
export interface Ticket {
  eventId: string,
  seatId: string,
  priceTierId: string,
  priceTier?: PriceTier,
  event?: Event,
  _id: string
}
