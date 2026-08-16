import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { BlogComponent } from './pages/blog/blog';
import { ContactComponent } from './pages/contact/contact';
import { PolicyComponent } from './pages/policy/policy';
import { AboutComponent } from './pages/about/about';
import { NotFoundComponent } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'shop', loadComponent: () => import('./pages/shop/shop').then(m => m.ShopComponent) },
  { path: 'category/:slug', loadComponent: () => import('./pages/shop/shop').then(m => m.ShopComponent) },
  { path: 'search', loadComponent: () => import('./pages/shop/shop').then(m => m.ShopComponent) },
  { path: 'product/:slug', loadComponent: () => import('./pages/product/product').then(m => m.ProductComponent) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then(m => m.CheckoutComponent) },
  {
    path: 'order-confirmation/:orderNumber',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation').then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.routes').then(m => m.accountRoutes)
  },
  { path: 'about', component: AboutComponent },
  { path: 'your-moments', redirectTo: 'about' },
  { path: 'contact', component: ContactComponent },
  { path: 'privacy-policy', component: PolicyComponent },
  { path: 'shipping-policy', component: PolicyComponent },
  { path: 'terms-of-service', component: PolicyComponent },
  { path: 'refund-policy', component: PolicyComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'blog/:slug', component: BlogComponent },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent }
];
