import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { DatetimeOffsetPipe } from '../../pipes/datetime-offset.pipe';
import { Show, Venue } from '../../interface'
import { ApiService } from '../../service/api.service';
import { EventFormComponent } from '../../forms/event-form/event-form.component';


@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatInputModule, MatFormFieldModule, MatSortModule,
    MatPaginatorModule, RouterModule, MatCardModule, MatButtonModule, DatePipe, DatetimeOffsetPipe],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.sass'
})
export class EventListComponent {
  loaded = false
  showDataSource: MatTableDataSource<Show> = new MatTableDataSource<Show>()
  showDataColumn = ['eventname', 'datetime', 'duration', 'venue.venuename', '_id']
  @Output() dataChanged = new EventEmitter()
  @Input()
  get shows() { return this.showDataSource.data }
  set shows(value) { this.showDataSource.data = value }
  @Input() venues: Venue[] = []
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  constructor(public dialog: MatDialog, private api: ApiService) {
  }
  ngAfterViewInit() {
    if (this.paginator && this.sort && this.showDataSource) {
      this.showDataSource.paginator = this.paginator;
      this.showDataSource.sort = this.sort;
      this.showDataSource.filterPredicate = (data: any, filter: string) => {
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
        const dataStr = this.showDataColumn.reduce(accumulator, '').toLowerCase();
        // Transform the filter by converting it to lowercase and removing whitespace.
        const transformedFilter = filter.split("+").map(f => f.trim().toLowerCase());
        return transformedFilter.filter(f => dataStr.indexOf(f) !== -1).length == transformedFilter.length;
      };
      this.showDataSource.sortingDataAccessor = (data: any, keys: string) => {
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
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.showDataSource) {
      this.showDataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  openForm(data: any = {}) {
    const dialogRef = this.dialog.open(EventFormComponent, {
      data: JSON.parse(JSON.stringify(data))
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      this.dataChanged.emit()
    })
  }
  delete(id: string) {
    return this.api.request.delete(`/Event/${id}`).toPromise().then(_ => {
      this.dataChanged.emit()
    })
  }

}

