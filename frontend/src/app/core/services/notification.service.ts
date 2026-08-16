import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let nextId = 1;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(type: ToastType, message: string): void {
    const toast: Toast = { id: nextId++, type, message };
    this._toasts.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 5000);
  }
}
