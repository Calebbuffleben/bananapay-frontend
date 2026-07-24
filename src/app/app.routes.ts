import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  buyerGuard,
  guestGuard,
  producerGuard,
} from './core/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductFormComponent } from './pages/product-form/product-form.component';
import { PublicCheckoutComponent } from './pages/public-checkout/public-checkout.component';
import { RegisterComponent } from './pages/register/register.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { InternalShellComponent } from './layout/internal-shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: 'conta/login',
    component: LoginComponent,
    canActivate: [guestGuard],
    data: { buyer: true },
  },
  {
    path: 'conta/register',
    component: RegisterComponent,
    canActivate: [guestGuard],
    data: { buyer: true },
  },
  {
    path: 'conta',
    canActivate: [buyerGuard],
    loadComponent: () =>
      import('./pages/buyer-account/buyer-account.component').then(
        (module) => module.BuyerAccountComponent,
      ),
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
  { path: 'products/new', redirectTo: 'app/products/new', pathMatch: 'full' },
  {
    path: 'app',
    component: InternalShellComponent,
    canActivate: [authGuard, producerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/internal-dashboard/internal-dashboard.component').then(
            (module) => module.InternalDashboardComponent,
          ),
      },
      { path: 'products', component: DashboardComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/:id/edit', component: ProductFormComponent },
      ...[
        ['sales', 'sales'],
        ['fees', 'fees'],
        ['subscriptions', 'subscriptions'],
        ['quizzes', 'quizzes'],
        ['affiliates', 'affiliates'],
        ['automations/flows', 'flows'],
        ['automations/reports', 'reports'],
        ['withdrawals', 'withdrawals'],
        ['webhooks', 'webhooks'],
      ].map(([path, section]) => ({
        path,
        data: { section },
        loadComponent: () =>
          import('./pages/workspace/workspace.component').then(
            (module) => module.WorkspaceComponent,
          ),
      })),
    ],
  },
  {
    path: 'admin',
    component: InternalShellComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      ...[
        ['dashboard', 'overview'],
        ['accounts', 'accounts'],
        ['transactions', 'transactions'],
        ['withdrawals', 'withdrawals'],
        ['audit', 'audit'],
      ].map(([path, resource]) => ({
        path,
        data: { resource },
        loadComponent: () =>
          import('./pages/admin/admin-page.component').then(
            (module) => module.AdminPageComponent,
          ),
      })),
    ],
  },
  { path: 'p/:slug', component: PublicCheckoutComponent },
  {
    path: 'quiz/:slug',
    loadComponent: () =>
      import('./pages/public-quiz/public-quiz.component').then(
        (module) => module.PublicQuizComponent,
      ),
  },
  { path: '**', redirectTo: 'login' },
];
