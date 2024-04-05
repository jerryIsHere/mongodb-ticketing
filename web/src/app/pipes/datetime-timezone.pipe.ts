import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datetimeTimezone',
  standalone: true
})
export class DatetimeTimezonePipe implements PipeTransform {

  transform(value: string | Date, ...args: unknown[]): Date {
    let d: Date
    if (typeof value == "string") {
      d = new Date(value)
    }
    else {
      d = value
    }
    d.setTime(d.getTime() + (new Date()).getTimezoneOffset() * 60000)
    return d;
  }

}
