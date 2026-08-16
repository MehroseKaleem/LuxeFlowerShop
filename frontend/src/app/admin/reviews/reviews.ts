import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { NotificationService } from '../../core/services/notification.service';
import { Review } from '../../models/review.model';

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
      next: () => {
        this.notifications.success('Review approved');
        this.refreshReviews();
        this.refreshCounts();
      }
    });
  }

  deleteReview(id: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.reviewService.adminDelete(id).subscribe({
      next: () => {
        this.refreshReviews();
        this.refreshCounts();
      }
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
