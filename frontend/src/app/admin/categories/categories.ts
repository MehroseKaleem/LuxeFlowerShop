import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Category } from '../../models/category.model';
import { mediaUrl } from '../../shared/utils/media.util';
import { formatApiError } from '../../shared/utils/api-error.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImgFallbackDirective],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  showAddModal = signal<boolean>(false);
  editingCategory = signal<Category | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal<string>('');
  imagePreview = signal<string | null>(null);
  saving = signal(false);

  private selectedFile: File | null = null;

  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['active', Validators.required]
  });

  filteredCategories = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.categories();
    return this.categories().filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.refreshCategories();
  }

  refreshCategories() {
    this.categoryService.adminList({ limit: 100 }).subscribe({ next: ({ items }) => this.categories.set(items) });
  }

  imageUrl(category: Category): string {
    return mediaUrl(category.image || category.fallbackImage, undefined, 300);
  }

  getProductCount(category: Category): number {
    return category._count?.products ?? 0;
  }

  openAddModal() {
    this.editingCategory.set(null);
    this.imagePreview.set(null);
    this.selectedFile = null;
    this.categoryForm.reset({ status: 'active' });
    this.showAddModal.set(true);
  }

  openEditModal(category: Category) {
    this.editingCategory.set(category);
    this.imagePreview.set(category.image ? mediaUrl(category.image, undefined, 600) : null);
    this.selectedFile = null;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      status: category.isActive === false ? 'inactive' : 'active'
    });
    this.showAddModal.set(true);
  }

  closeModal() {
    this.showAddModal.set(false);
    this.editingCategory.set(null);
    this.imagePreview.set(null);
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) this.processFile(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files?.[0]) this.processFile(event.dataTransfer.files[0]);
  }

  private processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  saveCategory() {
    if (this.categoryForm.invalid) return;

    const val = this.categoryForm.value;
    const editing = this.editingCategory();

    const formData = new FormData();
    formData.append('name', val.name);
    if (val.description) formData.append('description', val.description);
    formData.append('isActive', String(val.status === 'active'));
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.saving.set(true);
    const request = editing ? this.categoryService.adminUpdate(editing.id, formData) : this.categoryService.adminCreate(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(editing ? 'Category updated' : 'Category created');
        this.refreshCategories();
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.notifications.error(formatApiError(err, 'Could not save the category. Please try again.'));
      }
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.categoryService.adminDelete(id).subscribe({
      next: () => this.refreshCategories(),
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the category. Please try again.'))
    });
  }
}
