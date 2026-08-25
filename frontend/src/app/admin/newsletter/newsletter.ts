import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../services/newsletter.service';
import { NewsletterSubscriber } from '../../models/newsletter.model';

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter.html',
  styleUrl: './newsletter.scss'
})
export class NewsletterComponent implements OnInit {
  private newsletterService = inject(NewsletterService);

  subscribers = signal<NewsletterSubscriber[]>([]);
  total = signal(0);
  activeOnly = signal(false);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.newsletterService.adminList({ page: this.page(), limit: 50, isActive: this.activeOnly() || undefined }).subscribe({
      next: ({ items, meta }) => {
        this.subscribers.set(items);
        this.total.set(meta.total);
        this.totalPages.set(meta.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleActiveOnly(): void {
    this.activeOnly.update(v => !v);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
}
