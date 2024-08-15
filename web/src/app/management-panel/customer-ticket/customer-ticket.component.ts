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
import { TicketAPIObject, UserAPIObject, ticketConfirmDateString, ticketPurchaseDateString } from '../../interface-util'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import dateFormat, { masks } from "dateformat";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-customer-ticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule,
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe, DatePipe],
  templateUrl: './customer-ticket.component.html',
  styleUrl: './customer-ticket.component.sass'
})
export class CustomerTicketComponent {
  ticketLoaded = false
  ticketDataSource: MatTableDataSource<TicketAPIObject> = new MatTableDataSource<TicketAPIObject>()
  ticketDataColumn = ['event.eventname', 'seat', 'priceTier.tierName', 'priceTier.price', 'purchaseDate', '_id', 'securedBy'];
  users: UserAPIObject[] = [];
  tickets: TicketAPIObject[] = []
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  userSearch = new FormControl<string | UserAPIObject>('');
  filteredUsers: Observable<UserAPIObject[]> = new Observable<UserAPIObject[]>();

  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
  }

  displayFn(user: UserAPIObject): string {
    return user ? (user.fullname ? user.fullname : '') + (user.username ? `(${user.username})` : '') : '';
  }
  private _filter(keywords: string): UserAPIObject[] {
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
  openForm(data: TicketAPIObject) {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      data: JSON.parse(JSON.stringify(data)),
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      let ticket = result as TicketAPIObject
      if (ticket) {
        if (result.voided) {
          this.tickets = this.tickets.filter(t => t._id != ticket._id)
        }
        else {
          let ticketInd = this.tickets.findIndex(t => t._id == ticket._id)
          if (ticketInd > -1) this.tickets[ticketInd] = ticket
        }
        if (this.summary?.userId) {
          this.summarizeUser(this.summary.userId)
        }
        else {
          this.ticketDataSource.data = this.tickets.slice()
        }
      }
    })
  }
  userLoaded = false
  loadData() {
    let promises = []
    promises.push(this.api.request.get("/ticket?list&sold").toPromise().then((result: any) => {
      if (result && result.data) {
        this.ticketLoaded = true
        this.tickets = result.data
        this.ticketDataSource.data = this.tickets
      }
    }))
    promises.push(this.api.request.get("/user?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.userLoaded = true
        this.users = result.data
        this.filteredUsers = this.userSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            const keywords = typeof value === 'string' ? value : value?.username;
            return keywords ? this._filter(keywords as string) : this.users.slice();
          }),
        );
      }
    }))
    return Promise.all(promises)
  }
  summary: any

  userSelected(event: MatAutocompleteSelectedEvent) {
    if (event?.option?.value?._id) this.summarizeUser(event?.option?.value?._id)
  }
  summarizeUser(userId: string) {
    this.ticketDataSource.data = this.tickets.filter(ticket => "purchaseInfo" in ticket &&
      ticket.purchaseInfo?.purchaser?._id.toString() == userId)
    this.summary =
      this.ticketDataSource.data.reduce((summary, ticket, ind) => {
        if (ticket.priceTier.price)
          summary.totalCost += Number(ticket.priceTier.price)
        if (ticket.priceTier.tierName && ticket.priceTier.price) {
          let tierCount = summary.tierCount.get(ticket.priceTier.tierName)
          if (tierCount) {
            tierCount.count += 1
            summary.tierCount.set(ticket.priceTier.tierName, tierCount)
          }
          else {
            summary.tierCount.set(ticket.priceTier.tierName, { tierName: ticket.priceTier.tierName, count: 1, price: ticket.priceTier.price })
          }
        }

        return summary
      }, { tierCount: new Map<string, { tierName: string, count: number, price: number }>(), totalCost: 0, userId: userId })
  }
  ticketConfirmDateString(ticket: TicketAPIObject): string {
    return ticketConfirmDateString(ticket)
  }
  ticketPurchaseDateString(ticket: TicketAPIObject): string {
    return ticketPurchaseDateString(ticket)
  }
  downloadUserDataCSV() {
    this.loadData().then(() => {
      var data = "data:text/csv;charset=utf-8," +
        [
          ["_id", "username", "fullname", "email", "singingPart", "lastLoginDate", "latestTicketPurchaseDate", "latestTicketConfirmDate", "latestTicketConfirmationType",
            "latestTicketRemark",].join(","),
          ...this.users.map(user => {
            let sortedTicket = this.tickets.filter(ticket =>
              "purchaseInfo" in ticket && ticket.purchaseInfo?.purchaser?._id.toString() == user._id).sort((ticketA, ticketB) => {
                if ("purchaseInfo" in ticketA && "purchaseInfo" in ticketB && ticketA.purchaseInfo && ticketB.purchaseInfo) {
                  return new Date(ticketA.purchaseInfo.purchaseDate) > new Date(ticketB.purchaseInfo.purchaseDate) ? -1 :
                    new Date(ticketA.purchaseInfo.purchaseDate) < new Date(ticketB.purchaseInfo.purchaseDate) ? 1 : 0
                }
                if ("purchaseInfo" in ticketA) {
                  return -1
                }
                else if ("purchaseInfo" in ticketB) {
                  return 1
                }
                else {
                  return 0
                }
              }
              )
            let lastTicket = sortedTicket.length > 0 && "purchaseInfo" in sortedTicket[0] ? sortedTicket[0] : null
            return [
              user._id,
              user.username,
              user.fullname,
              user.email,
              user.singingPart,
              user.lastLoginDate ? dateFormat(new Date(user.lastLoginDate), 'yyyymmdd hhmmss') : '',
              lastTicket ? lastTicket.purchaseInfo ? dateFormat(new Date(lastTicket.purchaseInfo.purchaseDate), 'yyyymmdd hhmmss') : '' : '',
              lastTicket ? lastTicket.paymentInfo ? dateFormat(new Date(lastTicket.paymentInfo.confirmationDate), 'yyyymmdd hhmmss') : '' : '',
              lastTicket ? lastTicket.paymentInfo?.confirmedBy : '',
              lastTicket ? lastTicket.paymentInfo?.remark : '',

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
  downloadSoldTicketDataCSV() {
    this.loadData().then(() => {
      var data = "data:text/csv;charset=utf-8," +
        [
          ["_id",
            "event.eventname",
            "seat.row+seat.no",
            "priceTier.tierName",
            "priceTier.price",
            "occupant.username",
            "occupant.fullname",
            "purchaseDate",
            "confirmationDate",
            "confirmationType",
            "remark"].join(","),
          ...this.tickets.map(ticket =>
            [ticket._id,
            ticket?.event?.eventname,
            ticket.seat?.row && ticket.seat?.no ? ticket.seat?.row + ticket.seat?.no : '',
            ticket.priceTier.tierName,
            ticket.priceTier.price,
            "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser?.username : '',
            "purchaseInfo" in ticket ? ticket.purchaseInfo?.purchaser?.fullname : '',
            "purchaseInfo" in ticket && ticket.purchaseInfo?.purchaseDate ?
              dateFormat(new Date(ticket.purchaseInfo?.purchaseDate)) : '',
            "paymentInfo" in ticket && ticket.paymentInfo?.confirmationDate ?
              dateFormat(new Date(ticket.paymentInfo?.confirmationDate)) : '',
            "paymentInfo" in ticket ? ticket.paymentInfo?.confirmedBy : '',
            "paymentInfo" in ticket ? ticket.paymentInfo?.remark : '',
            ].map(value => value ? value : '').join(",")
          )
        ].join("\n")

      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(data));
      link.setAttribute("download", `ticketing-${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
    })
  }
}