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
import { Ticket, User, ticketConfirmDateString, ticketPurchaseDateString } from '../../interface'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';


@Component({
  selector: 'app-customer-ticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe, DatePipe],
  templateUrl: './customer-ticket.component.html',
  styleUrl: './customer-ticket.component.sass'
})
export class CustomerTicketComponent {
  loaded = false
  ticketDataSource: MatTableDataSource<Ticket> = new MatTableDataSource<Ticket>()
  ticketDataColumn = ['event.eventname', 'seat', 'priceTier.tierName', 'priceTier.price', 'purchaseDate', '_id', 'securedBy'];
  users: User[] = [];
  tickets: Ticket[] = []
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  userSearch = new FormControl<string | User>('');
  filteredUsers: Observable<User[]> = new Observable<User[]>();

  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
  }

  displayFn(user: User): string {
    return user ? (user.fullname ? user.fullname : '') + (user.username ? `(${user.username})` : '') : '';
  }
  private _filter(keywords: string): User[] {
    const filterValue = keywords.toLowerCase();
    if (this.users) {
      return this.users.filter(user =>
        user.fullname?.toLowerCase().includes(filterValue) ||
        user.singingPart?.toLowerCase()?.includes(filterValue) ||
        user.email?.toLowerCase()?.includes(filterValue) ||
        user.username?.toLowerCase()?.includes(filterValue) ||
        user._id?.toLowerCase()?.includes(filterValue)
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
        const dataStr = ['occupant.email', 'occupant.username', ...this.ticketDataColumn].reduce(accumulator, '').toLowerCase();
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
    this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
      if (result && result.data)
        this.tickets = result.data
      this.ticketDataSource.data = this.tickets
    })
    this.api.request.get("/user?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.users = result.data
        this.filteredUsers = this.userSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?.username;
            return keywords ? this._filter(keywords as string) : this.users.slice();
          }),
        );
      }
    })
  }
  summary: any
  userSelected(event: MatAutocompleteSelectedEvent) {
    console.log(event.option.value._id)
    this.ticketDataSource.data = this.tickets.filter(ticket => ticket.occupant._id == event.option.value._id)
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
  downloadUserDataCSV() {
    var data = "data:text/csv;charset=utf-8," +
      [
        ["_id", "username", "fullname", "email", "singingPart", "lastLoginDate"].join(","),
        ...this.users.map(user =>
          [user._id, user.username, user.fullname, user.email, user.singingPart, user.lastLoginDate ? new Date(user.lastLoginDate).toISOString() : ''].map(value => value ? value : '').join(",")
        )
      ].join("\n")

    var link = document.createElement("a");
    link.setAttribute("href", encodeURI(data));
    link.setAttribute("download", `USER-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
  }
  downloadSoldTicketDataCSV() {
    var data = "data:text/csv;charset=utf-8," +
      [
        ["_id", "event.eventname", "seat.row+seat.no", "priceTier.tierName", "priceTier.price", "occupant.username", "occupant.fullname", "purchaseDate", "confirmationDate"].join(","),
        ...this.tickets.map(ticket =>
          [ticket._id, ticket?.event?.eventname,
          ticket.seat?.row && ticket.seat?.no ? ticket.seat?.row.toUpperCase() + ticket.seat?.no : '',
          ticket.priceTier.tierName,
          ticket.priceTier.price,
          ticket.occupant.username,
          ticket.occupant.fullname,
          ticket.purchaseDate ? new Date(ticket.purchaseDate).toISOString() : '',
          ticket.confirmationDate ? new Date(ticket.confirmationDate).toISOString() : ''].map(value => value ? value : '').join(",")
        )
      ].join("\n")

    var link = document.createElement("a");
    link.setAttribute("href", encodeURI(data));
    link.setAttribute("download", `ticketing-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();

  }
}