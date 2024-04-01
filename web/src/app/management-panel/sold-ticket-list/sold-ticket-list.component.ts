import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ticket } from '../../interface'
import { ApiService } from '../../service/api.service';
import { TicketFormComponent } from '../../forms/ticket-form/ticket-form.component';


@Component({
  selector: 'app-sold-ticket-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatTooltipModule],
  templateUrl: './sold-ticket-list.component.html',
  styleUrl: './sold-ticket-list.component.sass'
})
export class SoldTicketListComponent {
  loaded = false
  ticketDataSource: MatTableDataSource<Ticket> = new MatTableDataSource<Ticket>()
  ticketDataColumn = ['event.eventname', 'event.datetime', 'seat', 'occupant.fullname', 'priceTier.price', '_id'];
  @Output() dataChanged = new EventEmitter()
  @Input()
  get tickets() { return this.ticketDataSource.data }
  set tickets(value) { this.ticketDataSource.data = value }
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(public dialog: MatDialog, private api: ApiService) {
    this.loadData()
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
        const transformedFilter = filter.trim().toLowerCase();
        return dataStr.indexOf(transformedFilter) !== -1;
      };
      this.ticketDataSource.sortingDataAccessor = valueAccessor
    }
  }
  loadData() {
    return this.api.request.get("/ticket?my").toPromise().then((result: any) => {
      if (result && result.data) {
        this.loaded = true
        this.ticketDataSource.data = result.data
      }
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.ticketDataSource) {
      this.ticketDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: Ticket) {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      data: JSON.parse(JSON.stringify(data))
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      this.dataChanged.emit()
    })
  }

}