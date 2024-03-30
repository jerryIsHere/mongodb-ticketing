import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Ticket } from '../interface'
import { ApiService } from '../service/api.service';


@Component({
  selector: 'app-myticket',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule, MatPaginatorModule],
  templateUrl: './myticket.component.html',
  styleUrl: './myticket.component.sass'
})
export class MyticketComponent {
  loaded = false
  ticketDataSource: MatTableDataSource<Ticket[]> = new MatTableDataSource<Ticket[]>()
  ticketDataColumn = ['eventname', 'eventdatetime', 'seat', 'priceTier',];
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(private api: ApiService) {
    this.loadData()
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.ticketDataSource) {
      this.ticketDataSource.paginator = this.paginator;
      this.ticketDataSource.sort = this.sort;
      this.ticketDataSource.filterPredicate = (data: any, filter: string) => {
        const accumulator = (valueString: string, keys: string) => {
          let cursor: any = data;
          for (let key of keys.split(".")) {
            if (cursor[key]) {
              cursor = cursor[key]
            }
            else {
              break;
            }
          }
          if (typeof cursor === "string") {
            valueString += cursor
          }
          return valueString;
        };
        const dataStr = this.ticketDataColumn.reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.trim().toLowerCase();
        return dataStr.indexOf(transformedFilter) !== -1;
      };
      this.ticketDataSource.sortingDataAccessor = (data: any, keys: string) => {
        let cursor: any = data;
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

}
