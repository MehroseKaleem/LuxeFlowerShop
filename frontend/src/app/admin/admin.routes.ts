import { Routes } from '@angular/router';
import { adminGuard, adminGuestOnlyGuard } from '../guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    canActivate: [adminGuestOnlyGuard],
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./products/products').then(m => m.ProductsComponent) },
      { path: 'products/add', loadComponent: () => import('./add-product/add-product').then(m => m.AddProductComponent) },
      { path: 'products/edit/:id', loadComponent: () => import('./add-product/add-product').then(m => m.AddProductComponent) },
      { path: 'categories', loadComponent: () => import('./categories/categories').then(m => m.CategoriesComponent) },
      { path: 'orders', loadComponent: () => import('./orders/orders').then(m => m.OrdersComponent) },
      { path: 'cart-items', loadComponent: () => import('./cart-items/cart-items').then(m => m.CartItemsComponent) },
      { path: 'reviews', loadComponent: () => import('./reviews/reviews').then(m => m.ReviewsComponent) },
      { path: 'contacts', loadComponent: () => import('./contacts/contacts').then(m => m.ContactsComponent) },
      { path: 'customers', loadComponent: () => import('./customers/customers').then(m => m.CustomersComponent) },
      { path: 'banners', loadComponent: () => import('./banners/banners').then(m => m.BannersComponent) },
      { path: 'coupons', loadComponent: () => import('./coupons/coupons').then(m => m.CouponsComponent) },
      { path: 'newsletter', loadComponent: () => import('./newsletter/newsletter').then(m => m.NewsletterComponent) },
      { path: 'settings', loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent) }
    ]
  }
];
