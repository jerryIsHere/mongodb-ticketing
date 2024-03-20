import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-ticketing',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './ticketing.component.html',
  styleUrl: './ticketing.component.sass'
})
export class TicketingComponent {
  public events: Event[] | null = null;

}

export interface Event {
  name: string;
}
