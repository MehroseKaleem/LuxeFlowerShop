import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from '../guards/auth.guard';

export const accountRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./login/login').then(m => m.AccountLoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email/:token',
    loadComponent: () => import('./verify-email/verify-email').then(m => m.VerifyEmailComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./account-layout/account-layout').then(m => m.AccountLayoutComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent) },
      { path: 'addresses', loadComponent: () => import('./addresses/addresses').then(m => m.AddressesComponent) },
      { path: 'orders', loadComponent: () => import('./orders/orders').then(m => m.AccountOrdersComponent) },
      { path: 'orders/:orderNumber', loadComponent: () => import('./order-detail/order-detail').then(m => m.OrderDetailComponent) },
      { path: 'wishlist', loadComponent: () => import('./wishlist/wishlist').then(m => m.AccountWishlistComponent) }
    ]
  }
];
