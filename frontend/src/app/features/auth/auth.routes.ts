import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/guest.guard';
import { AuthLayout } from './auth-layout/auth-layout';

/**
 * Pantallas públicas de autenticación (contracts/routes.md). `guestGuard` no se
 * aplica a la nueva contraseña (usa la sesión de recuperación), al retorno de
 * enlaces ni a las pantallas de acceso denegado y academia suspendida (FR-020).
 */
export default [
    {
        path: '',
        component: AuthLayout,
        children: [
            { path: 'login', title: 'Iniciar sesión · PlayerTech', canActivate: [guestGuard], loadComponent: () => import('./login/login').then((m) => m.LoginPage) },
            { path: 'register', title: 'Crea tu academia · PlayerTech', canActivate: [guestGuard], loadComponent: () => import('./register/register').then((m) => m.RegisterPage) },
            { path: 'verify-email', title: 'Verifica tu correo · PlayerTech', canActivate: [guestGuard], loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmailPage) },
            { path: 'forgot-password', title: 'Recuperar contraseña · PlayerTech', canActivate: [guestGuard], loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordPage) },
            { path: 'reset-password', title: 'Nueva contraseña · PlayerTech', loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPasswordPage) },
            { path: 'callback', title: 'Verificando · PlayerTech', loadComponent: () => import('./callback/callback').then((m) => m.CallbackPage) },
            { path: 'access-denied', title: 'Sin acceso · PlayerTech', loadComponent: () => import('./access-denied/access-denied').then((m) => m.AccessDeniedPage) },
            { path: 'suspended', title: 'Academia suspendida · PlayerTech', loadComponent: () => import('./suspended/suspended').then((m) => m.SuspendedPage) },
            { path: '', pathMatch: 'full', redirectTo: 'login' }
        ]
    }
] satisfies Routes;
