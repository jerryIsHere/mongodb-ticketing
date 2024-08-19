import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common'

@Pipe({
  name: 'datetimeOffset',
  standalone: true
})
export class DatetimeOffsetPipe implements PipeTransform {

  transform(value: string | Date, ...args: number[]): Date {
    let date = new Date(value)
    args.forEach(minute => {
      date = new Date(date.getTime() + minute * 60000)
    })
    return date;
  }

}
