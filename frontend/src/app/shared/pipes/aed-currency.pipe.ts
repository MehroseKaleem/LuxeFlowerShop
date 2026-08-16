import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'aedCurrency',
  standalone: true
})
export class AedCurrencyPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numeric)) return '';
    return `AED ${numeric.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
