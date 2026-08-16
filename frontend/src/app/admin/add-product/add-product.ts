import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Category } from '../../models/category.model';
import { Product, ProductImage } from '../../models/product.model';
import { mediaUrl } from '../../shared/utils/media.util';

@Component({
  selector: 'app-admin-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss'
})
export class AddProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  categoryError = signal(false);

  categories: Category[] = [];
  productForm!: FormGroup;
  editProductId: number | null = null;

  // Create-mode: files picked before the product exists yet.
  newImageFiles: File[] = [];
  newImagePreviews = signal<string[]>([]);

  // Edit-mode: images already saved on the product.
  existingImages = signal<ProductImage[]>([]);
  uploadingImages = signal(false);

  ngOnInit() {
    this.categoryService.list().subscribe({
      next: cats => {
        this.categories = cats;
        this.initForm();

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          this.isEditMode.set(true);
          this.editProductId = parseInt(idParam, 10);
          this.loadProductData(this.editProductId);
        }
      }
    });
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      shortDescription: [''],
      description: ['', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0.01)]],
      discountPrice: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoryIds: this.fb.array(this.categories.map(() => new FormControl(false))),
      status: ['active']
    });
  }

  get categoryControls(): FormControl[] {
    return (this.productForm.get('categoryIds') as FormArray).controls as FormControl[];
  }

  loadProductData(id: number) {
    this.productService.adminGet(id).subscribe({
      next: product => {
        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          shortDescription: product.shortDescription,
          description: product.description,
          basePrice: Number(product.basePrice),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          stock: product.stock,
          status: product.isActive ? 'active' : 'draft'
        });

        this.existingImages.set(product.images);

        const categoryControls = this.productForm.get('categoryIds') as FormArray;
        const selectedIds = product.categories.map(c => c.id);
        this.categories.forEach((cat, index) => {
          categoryControls.at(index).setValue(selectedIds.includes(cat.id));
        });
      },
      error: () => this.router.navigate(['/admin/products'])
    });
  }

  private selectedCategoryIds(): number[] {
    return this.productForm.value.categoryIds
      .map((checked: boolean, i: number) => (checked ? this.categories[i].id : null))
      .filter((v: number | null): v is number => v !== null);
  }

  onImageSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    this.handleImageFiles(Array.from(files));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) return;
    this.handleImageFiles(Array.from(files));
  }

  private handleImageFiles(files: File[]) {
    if (this.isEditMode() && this.editProductId) {
      this.uploadImagesToExistingProduct(files);
      return;
    }

    this.newImageFiles.push(...files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.newImagePreviews.update(list => [...list, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  private uploadImagesToExistingProduct(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    this.uploadingImages.set(true);
    this.productService.adminAddImages(this.editProductId!, formData).subscribe({
      next: images => {
        this.existingImages.set([...this.existingImages(), ...images]);
        this.uploadingImages.set(false);
      },
      error: () => this.uploadingImages.set(false)
    });
  }

  removeNewImage(index: number): void {
    this.newImageFiles.splice(index, 1);
    this.newImagePreviews.update(list => list.filter((_, i) => i !== index));
  }

  imageUrl(url: string): string {
    return mediaUrl(url);
  }

  deleteExistingImage(imageId: number): void {
    if (!this.editProductId) return;
    this.productService.adminDeleteImage(this.editProductId, imageId).subscribe({
      next: () => this.existingImages.update(list => list.filter(i => i.id !== imageId))
    });
  }

  setPrimaryImage(imageId: number): void {
    if (!this.editProductId) return;
    this.productService.adminSetPrimaryImage(this.editProductId, imageId).subscribe({
      next: () => this.existingImages.update(list => list.map(i => ({ ...i, isPrimary: i.id === imageId })))
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const categoryIds = this.selectedCategoryIds();
    if (!categoryIds.length) {
      this.categoryError.set(true);
      return;
    }
    this.categoryError.set(false);

    this.isSubmitting.set(true);
    const value = this.productForm.value;

    if (this.isEditMode() && this.editProductId) {
      this.productService
        .adminUpdate(this.editProductId, {
          name: value.name,
          sku: value.sku,
          shortDescription: value.shortDescription || undefined,
          description: value.description,
          basePrice: value.basePrice,
          discountPrice: value.discountPrice || null,
          stock: value.stock,
          isActive: value.status === 'active',
          categoryIds
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.notifications.success('Product updated');
            this.router.navigate(['/admin/products']);
          },
          error: () => this.isSubmitting.set(false)
        });
    } else {
      const formData = new FormData();
      formData.append('name', value.name);
      formData.append('sku', value.sku);
      if (value.shortDescription) formData.append('shortDescription', value.shortDescription);
      formData.append('description', value.description);
      formData.append('basePrice', String(value.basePrice));
      if (value.discountPrice) formData.append('discountPrice', String(value.discountPrice));
      formData.append('stock', String(value.stock));
      formData.append('isActive', String(value.status === 'active'));
      categoryIds.forEach(id => formData.append('categoryIds', String(id)));
      this.newImageFiles.forEach(file => formData.append('images', file));

      this.productService.adminCreate(formData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notifications.success('Product created');
          this.router.navigate(['/admin/products']);
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
