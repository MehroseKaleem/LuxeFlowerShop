import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReviewService } from '../../services/review.service';
import { NotificationService } from '../../core/services/notification.service';
import { Review } from '../../models/review.model';
import { formatApiError } from '../../shared/utils/api-error.util';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss'
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private notifications = inject(NotificationService);

  reviews = signal<Review[]>([]);
  total = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);
  loading = signal(true);

  statusFilter = signal<'all' | 'pending' | 'approved'>('all');
  searchQuery = signal<string>('');

  ngOnInit() {
    this.refreshReviews();
    this.refreshCounts();
  }

  refreshReviews() {
    this.loading.set(true);
    const isApproved = this.statusFilter() === 'all' ? undefined : this.statusFilter() === 'approved';
    this.reviewService.adminList({ limit: 50, isApproved, sortBy: 'createdAt', sortOrder: 'desc' }).subscribe({
      next: ({ items, meta }) => {
        this.reviews.set(items);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private refreshCounts() {
    this.reviewService.adminList({ isApproved: 'false', limit: 1 }).subscribe({ next: ({ meta }) => this.pendingCount.set(meta.total) });
    this.reviewService.adminList({ isApproved: 'true', limit: 1 }).subscribe({ next: ({ meta }) => this.approvedCount.set(meta.total) });
  }

  setFilter(filter: 'all' | 'pending' | 'approved'): void {
    this.statusFilter.set(filter);
    this.refreshReviews();
  }

  matchesSearch(review: Review): boolean {
    const q = this.searchQuery().toLowerCase();
    if (!q) return true;
    return (review.user?.name || '').toLowerCase().includes(q) || (review.comment || '').toLowerCase().includes(q);
  }

  approveReview(id: number) {
    this.reviewService.adminApprove(id).subscribe({
      next: updatedReview => {
        this.notifications.success('Review approved');
        // Patch in place - unless we're viewing the "pending" filter, in
        // which case a now-approved review no longer belongs in this list
        // and should just drop out of it.
        if (this.statusFilter() === 'pending') {
          this.reviews.update(list => list.filter(r => r.id !== id));
          this.total.update(t => t - 1);
        } else {
          this.reviews.update(list => list.map(r => (r.id === id ? updatedReview : r)));
        }
        this.pendingCount.update(c => Math.max(c - 1, 0));
        this.approvedCount.update(c => c + 1);
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not approve the review. Please try again.'))
    });
  }

  deleteReview(id: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const wasApproved = this.reviews().find(r => r.id === id)?.isApproved;
    this.reviewService.adminDelete(id).subscribe({
      next: () => {
        this.reviews.update(list => list.filter(r => r.id !== id));
        this.total.update(t => t - 1);
        if (wasApproved) this.approvedCount.update(c => Math.max(c - 1, 0));
        else this.pendingCount.update(c => Math.max(c - 1, 0));
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the review. Please try again.'))
    });
  }

  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
