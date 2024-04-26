import { Component, ViewChild, Input, Output, EventEmitter, } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Ticket, Show, ticketConfirmDateString, ticketPurchaseDateString } from '../../interface'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import dateFormat, { masks } from "dateformat";
import { PaymentMessageComponent } from '../payment-message/payment-message.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-event-payment',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe, DatePipe,
    PaymentMessageComponent],
  templateUrl: './event-payment.component.html',
  styleUrl: './event-payment.component.sass'
})
export class EventPaymentComponent {
  loaded = false
  ticketDataSource: MatTableDataSource<Ticket> = new MatTableDataSource<Ticket>()
  ticketDataColumn = ['event.eventname', 'seat', 'priceTier.tierName', 'priceTier.price', 'purchaseDate', 'securedBy'];
  shows: Show[] = [];
  tickets: Ticket[] = []
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  showSearch = new FormControl<string | Show>('');
  filteredShows: Observable<Show[]> = new Observable<Show[]>();
  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
  }

  displayFn(event: Show): string {
    return event && event.eventname ? event.eventname : '';
  }
  private _filter(keywords: string): Show[] {
    const filterValue = keywords.toLowerCase();
    if (this.shows) {
      return this.shows.filter(event =>
        event.eventname?.toLowerCase().includes(filterValue) ||
        event._id?.toLowerCase()?.includes(filterValue)
      );
    }
    else {
      return []
    }
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.ticketDataSource) {
      this.ticketDataSource.paginator = this.paginator;
      this.ticketDataSource.sort = this.sort;
      let valueAccessor = (data: any, keys: string) => {
        let cursor: any = data;
        if (keys == 'seat') {
          return data.seat.row + data.seat.no
        } else {
          for (let key of keys.split(".")) {
            if (cursor[key]) {
              cursor = cursor[key]
            }
            else {
              break;
            }
          }
          return cursor
        }
      }
      this.ticketDataSource.filterPredicate = (data: any, filter: string) => {
        const accumulator = (valueString: string, keys: string) => {
          let value: any = valueAccessor(data, keys)
          if (typeof value === "string") {
            valueString += value
          }
          return valueString;
        };
        const dataStr = ['occupant.email', 'occupant.eventname', ...this.ticketDataColumn].reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.split("+").map(f => f.trim().toLowerCase());
        return transformedFilter.filter(f => dataStr.indexOf(f) !== -1).length == transformedFilter.length;
      };
      this.ticketDataSource.sortingDataAccessor = valueAccessor
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.ticketDataSource) {
      this.ticketDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: Ticket) {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      let ticket = result as Ticket
      if (ticket) {
        if (result.voided) {
          this.tickets = this.tickets.filter(t => t._id != ticket._id)
        }
        else {
          let ticketInd = this.tickets.findIndex(t => t._id == ticket._id)
          if (ticketInd > -1) this.tickets[ticketInd] = ticket
        }
        this.ticketDataSource.data = this.tickets.slice()
      }
    })
  }
  loadData() {
    return this.api.request.get("/ticket?my").toPromise().then((result: any) => {
      if (result && result.data) {
        this.loaded = true
        this.ticketDataSource.data = result.data.slice()
        this.tickets = result.data.slice()
        this.shows = [];
        result.data.reduce((_: Show[], ticket: Ticket, __: number) => {
          if (ticket.event && this.shows.findIndex(show => ticket.event && show._id == ticket.event._id) < 0) this.shows.push(ticket.event)
        }, this.shows)
        this.shows.sort((showA, showB) => {
          if (showA.datetime && showB.datetime) {
            return new Date(showA.datetime) > new Date(showB.datetime) ? -1 :
              new Date(showA.datetime) < new Date(showB.datetime) ? 1 : 0
          }
          else {
            if (showA.datetime) {
              return -1
            }
            else if (showB.datetime) {
              return 1
            }
            else {
              return 0

            }
          }
        })
        this.filteredShows = this.showSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?._id;
            return keywords ? this._filter(keywords as string) : this.shows.slice();
          }),
        );
      }
    })
  }
  summary: any
  showSelected(event: MatAutocompleteSelectedEvent) {
    console.log(event.option.value._id)
    this.ticketDataSource.data = this.tickets.filter(ticket => ticket.eventId == event.option.value._id)
    this.summary =
      this.ticketDataSource.data.reduce((summary, ticket, ind) => {
        if (ticket.priceTier.price)
          summary.totalCost += Number(ticket.priceTier.price)
        if (ticket.priceTier.tierName && ticket.priceTier._id && ticket.priceTier.price) {
          let tierCount = summary.tierCount.get(ticket.priceTier._id)
          if (tierCount) {
            tierCount.count += 1
            summary.tierCount.set(ticket.priceTier._id, tierCount)
          }
          else {
            summary.tierCount.set(ticket.priceTier._id, { tierName: ticket.priceTier.tierName, count: 1, price: ticket.priceTier.price })
          }
        }

        return summary
      }, { tierCount: new Map<string, { tierName: string, count: number, price: number }>(), totalCost: 0 })
  }
  ticketConfirmDateString(ticket: Ticket): string {
    return ticketConfirmDateString(ticket)
  }
  ticketPurchaseDateString(ticket: Ticket): string {
    return ticketPurchaseDateString(ticket)
  }
}
