import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BannerService } from '../../services/banner.service';
import { NotificationService } from '../../core/services/notification.service';
import { Banner } from '../../models/banner.model';
import { mediaUrl } from '../../shared/utils/media.util';
import { formatApiError } from '../../shared/utils/api-error.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

const POSITIONS = ['HOME_HERO', 'HOME_SECONDARY', 'CATEGORY_TOP'];

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImgFallbackDirective],
  templateUrl: './banners.html',
  styleUrl: './banners.scss'
})
export class BannersComponent implements OnInit {
  private bannerService = inject(BannerService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  readonly positions = POSITIONS;

  banners = signal<Banner[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingBanner = signal<Banner | null>(null);
  imagePreview = signal<string | null>(null);
  saving = signal(false);
  private selectedFile: File | null = null;

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    link: [''],
    position: [POSITIONS[0], Validators.required],
    sortOrder: [0],
    isActive: [true],
    startsAt: [''],
    endsAt: ['']
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bannerService.adminList({ limit: 100 }).subscribe({
      next: ({ items }) => {
        this.banners.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  imageUrl(url: string): string {
    return mediaUrl(url, undefined, 300);
  }

  openAddModal() {
    this.editingBanner.set(null);
    this.imagePreview.set(null);
    this.selectedFile = null;
    this.form.reset({ position: POSITIONS[0], sortOrder: 0, isActive: true });
    this.showModal.set(true);
  }

  openEditModal(banner: Banner) {
    this.editingBanner.set(banner);
    this.imagePreview.set(mediaUrl(banner.imageUrl, undefined, 600));
    this.selectedFile = null;
    this.form.patchValue({
      title: banner.title,
      link: banner.link || '',
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startsAt: banner.startsAt ? banner.startsAt.substring(0, 10) : '',
      endsAt: banner.endsAt ? banner.endsAt.substring(0, 10) : ''
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingBanner.set(null);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  save() {
    if (this.form.invalid) return;
    const editing = this.editingBanner();
    if (!editing && !this.selectedFile) {
      this.notifications.error('Please select a banner image.');
      return;
    }

    const value = this.form.value;
    const formData = new FormData();
    formData.append('title', value.title);
    if (value.link) formData.append('link', value.link);
    formData.append('position', value.position);
    formData.append('sortOrder', String(value.sortOrder));
    formData.append('isActive', String(value.isActive));
    if (value.startsAt) formData.append('startsAt', value.startsAt);
    if (value.endsAt) formData.append('endsAt', value.endsAt);
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.saving.set(true);
    const request = editing ? this.bannerService.adminUpdate(editing.id, formData) : this.bannerService.adminCreate(formData);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(editing ? 'Banner updated' : 'Banner created');
        this.load();
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.notifications.error(formatApiError(err, 'Could not save the banner. Please try again.'));
      }
    });
  }

  delete(id: number) {
    if (!confirm('Delete this banner?')) return;
    this.bannerService.adminDelete(id).subscribe({
      next: () => this.banners.update(list => list.filter(b => b.id !== id)),
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the banner. Please try again.'))
    });
  }
}
