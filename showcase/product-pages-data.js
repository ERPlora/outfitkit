/* Catálogo manual de las superficies propias de ERPlora.
 *
 * Regla: una entrada solo representa una ruta que existe hoy en SaaS o Hub.
 * `parity: current` significa que el HTML del showcase fue rehecho desde la fuente
 * indicada; `pending` evita presentar un prototipo antiguo como si fuera el producto.
 * Las páginas de módulos se generan aparte desde sus module.json.
 */

const page = (surface, section, id, name, route, source, icon, file, parity = 'pending') => ({
  id,
  name,
  surface,
  section,
  route,
  source,
  icon,
  ...(file ? { file } : {}),
  parity,
});

export const SAAS_PAGES = [
  // Autenticación
  page('saas', 'Autenticación', 'auth-login-saas', 'Iniciar sesión', '/account/login/', 'saas/templates/two_factor/core/login.html', 'log-in-outline', 'pages/auth-login-saas.html', 'current'),
  page('saas', 'Autenticación', 'auth-2fa-setup', 'Configurar 2FA', '/account/two_factor/setup/', 'saas/templates/two_factor/core/setup.html', 'shield-checkmark-outline', 'pages/auth-2fa-setup.html', 'current'),
  page('saas', 'Autenticación', 'auth-2fa-profile', 'Perfil 2FA', '/account/two_factor/', 'saas/templates/two_factor/profile/profile.html', 'shield-outline', 'pages/auth-2fa-profile.html', 'current'),
  page('saas', 'Autenticación', 'auth-2fa-disable', 'Desactivar 2FA', '/account/two_factor/disable/', 'saas/templates/two_factor/profile/disable.html', 'shield-half-outline', 'pages/auth-2fa-disable.html', 'current'),
  page('saas', 'Autenticación', 'auth-change-password', 'Cambiar contraseña', '/dashboard/profile/change-password/', 'saas/apps/dashboard/profile/templates/dashboard/profile/pages/change_password.html', 'key-outline', 'pages/auth-change-password.html', 'current'),
  page('saas', 'Autenticación', 'auth-sessions', 'Sesiones activas', '/dashboard/profile/sessions/', 'saas/apps/dashboard/profile/templates/dashboard/profile/pages/sessions.html', 'desktop-outline', 'pages/auth-sessions.html', 'current'),
  page('saas', 'Autenticación', 'auth-delete-account', 'Eliminar cuenta', '/dashboard/profile/delete/', 'saas/apps/dashboard/profile/templates/dashboard/profile/pages/delete_confirm.html', 'trash-outline', 'pages/auth-delete-account.html', 'current'),

  // Operaciones
  page('saas', 'Operaciones', 'dashboard-saas', 'Resumen general', '/dashboard/', 'saas/apps/dashboard/overview/templates/dashboard/overview/pages/index.html', 'speedometer-outline', 'pages/dashboard-saas.html', 'current'),
  page('saas', 'Operaciones', 'billing-invoices', 'Facturas', '/dashboard/billing/invoices/', 'saas/apps/dashboard/billing/templates/dashboard/billing/pages/invoices.html', 'receipt-outline', 'pages/billing-invoices.html', 'current'),
  page('saas', 'Operaciones', 'billing-invoice-detail', 'Detalle de factura', '/dashboard/billing/invoices/<invoice_id>/', 'saas/apps/dashboard/billing/templates/dashboard/billing/pages/invoice_detail.html', 'document-text-outline', 'pages/billing-invoice-detail.html', 'current'),
  page('saas', 'Operaciones', 'billing-subscriptions', 'Suscripciones', '/dashboard/billing/subscriptions/', 'saas/apps/dashboard/billing/templates/dashboard/billing/pages/subscriptions.html', 'repeat-outline', 'pages/billing-subscriptions.html', 'current'),
  page('saas', 'Operaciones', 'billing-purchases', 'Compras', '/dashboard/billing/purchases/', 'saas/apps/dashboard/billing/templates/dashboard/billing/pages/purchases.html', 'bag-handle-outline', 'pages/billing-purchases.html', 'current'),
  page('saas', 'Operaciones', 'billing-payment-history', 'Pagos', '/dashboard/payments/', 'saas/apps/dashboard/payments/templates/dashboard/payments/pages/index.html', 'time-outline', 'pages/billing-payment-history.html', 'current'),
  page('saas', 'Operaciones', 'assistant-saas', 'Asistente', '/dashboard/assistant/', 'saas/apps/dashboard/assistant/templates/dashboard/assistant/pages/index.html', 'sparkles-outline', 'pages/assistant-saas.html', 'current'),

  // Marketplace real de módulos
  page('saas', 'Marketplace', 'marketplace-modules', 'Módulos', '/dashboard/marketplace/', 'saas/apps/dashboard/marketplace/templates/dashboard/marketplace/pages/index.html', 'storefront-outline', 'pages/marketplace-modules.html', 'current'),
  page('saas', 'Marketplace', 'marketplace-plans', 'Planes', '/dashboard/marketplace/plans/', 'saas/apps/dashboard/marketplace/templates/dashboard/marketplace/pages/plans.html', 'pricetags-outline', 'pages/marketplace-plans.html', 'current'),
  page('saas', 'Marketplace', 'marketplace-module-detail', 'Detalle de módulo', '/dashboard/marketplace/modules/<slug>/', 'saas/apps/dashboard/marketplace/templates/dashboard/marketplace/pages/module_detail.html', 'cube-outline', 'pages/marketplace-module-detail.html', 'current'),

  // Organizaciones y usuarios
  page('saas', 'Organizaciones', 'orgs-list', 'Organizaciones', '/dashboard/organizations/', 'saas/apps/dashboard/organizations/templates/dashboard/organizations/pages/index.html', 'business-outline', 'pages/orgs-list.html', 'current'),
  page('saas', 'Organizaciones', 'orgs-create', 'Crear organización', '/dashboard/organizations/create/', 'saas/apps/dashboard/organizations/templates/dashboard/organizations/pages/create.html', 'add-circle-outline', 'pages/orgs-create.html', 'current'),
  page('saas', 'Organizaciones', 'orgs-detail', 'Detalle de organización', '/dashboard/organizations/<org_id>/', 'saas/apps/dashboard/organizations/templates/dashboard/organizations/pages/detail.html', 'business-outline', 'pages/orgs-detail.html', 'current'),
  page('saas', 'Organizaciones', 'orgs-invite', 'Invitar a organización', '/dashboard/organizations/<org_id>/invite/', 'saas/apps/dashboard/organizations/templates/dashboard/organizations/pages/invite_member.html', 'person-add-outline', 'pages/orgs-invite.html', 'current'),
  page('saas', 'Usuarios', 'users-list', 'Usuarios', '/dashboard/users/', 'saas/apps/dashboard/users/templates/users/pages/users_list.html', 'people-outline', 'pages/users-list.html', 'current'),
  page('saas', 'Usuarios', 'users-invite', 'Invitar usuario', '/dashboard/users/invite/', 'saas/apps/dashboard/users/templates/users/pages/invite_user.html', 'person-add-outline', 'pages/users-invite.html', 'current'),

  // Hubs gestionados desde Cloud
  page('saas', 'Hubs', 'hubs-dashboard', 'Resumen del hub', '/dashboard/hubs/<hub_id>/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/dashboard.html', 'speedometer-outline', 'pages/hubs-dashboard.html', 'current'),
  page('saas', 'Hubs', 'hubs-active', 'Hubs activos', '/dashboard/hubs/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/active_hubs.html', 'cube-outline', 'pages/hubs-active.html', 'current'),
  page('saas', 'Hubs', 'hubs-inactive', 'Hubs inactivos', '/dashboard/hubs/inactive/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/inactive_hubs.html', 'archive-outline', 'pages/hubs-inactive.html', 'current'),
  page('saas', 'Hubs', 'hubs-create', 'Crear hub', '/dashboard/hubs/create/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/create_hub.html', 'add-circle-outline', 'pages/hubs-create.html', 'current'),
  page('saas', 'Hubs', 'hubs-settings', 'Ajustes del hub', '/dashboard/hubs/<hub_id>/settings/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/hub_settings.html', 'settings-outline', 'pages/hubs-settings.html', 'current'),
  page('saas', 'Hubs', 'hubs-users', 'Usuarios del hub', '/dashboard/hubs/<hub_id>/users/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/hub_users.html', 'people-outline', 'pages/hubs-users.html', 'current'),
  page('saas', 'Hubs', 'hubs-modules', 'Módulos del hub', '/dashboard/hubs/<hub_id>/modules/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/hub_modules.html', 'apps-outline', 'pages/hubs-modules.html', 'current'),
  page('saas', 'Hubs', 'hubs-qr', 'Acceso QR', '/dashboard/hubs/<hub_id>/qr/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/hub_qr.html', 'qr-code-outline', 'pages/hubs-qr.html', 'current'),
  page('saas', 'Hubs', 'hubs-domain', 'Dominio del hub', '/dashboard/hubs/<hub_id>/domain/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/domain_config.html', 'globe-outline', 'pages/hubs-domain.html', 'current'),
  page('saas', 'Hubs', 'hubs-change-plan', 'Cambiar plan', '/dashboard/hubs/<hub_id>/change-plan/', 'saas/apps/dashboard/hubs/main/templates/hubs/pages/change_plan.html', 'pricetags-outline', 'pages/hubs-change-plan.html', 'current'),
  page('saas', 'Hubs', 'hubs-files', 'Archivos del hub', '/dashboard/hubs/files/<hub_id>/', 'saas/apps/dashboard/hubs/files/templates/hubs/files/pages/browser.html', 'folder-open-outline', 'pages/hubs-files.html', 'current'),

  // Perfil, ajustes y ayuda
  page('saas', 'Cuenta', 'profile-saas', 'Perfil', '/dashboard/profile/', 'saas/apps/dashboard/profile/templates/dashboard/profile/pages/index.html', 'person-circle-outline', 'pages/profile-saas.html', 'current'),
  page('saas', 'Cuenta', 'settings-preferences', 'Preferencias', '/dashboard/settings/', 'saas/apps/dashboard/settings/templates/dashboard/settings/pages/index.html', 'options-outline', 'pages/settings-preferences.html', 'current'),
  page('saas', 'Cuenta', 'settings-devices', 'Dispositivos de confianza', '/dashboard/settings/trusted-devices/', 'saas/apps/dashboard/settings/templates/dashboard/settings/pages/trusted_devices.html', 'phone-portrait-outline', 'pages/settings-devices.html', 'current'),
  page('saas', 'Ayuda', 'settings-help', 'Centro de ayuda', '/dashboard/help/', 'saas/apps/dashboard/help/templates/dashboard/help/pages/index.html', 'help-circle-outline', 'pages/settings-help.html', 'current'),
  page('saas', 'Ayuda', 'help-support', 'Soporte', '/dashboard/help/support/', 'saas/apps/dashboard/help/templates/dashboard/help/pages/support.html', 'chatbubble-ellipses-outline', 'pages/help-support.html', 'current'),
  page('saas', 'Ayuda', 'help-document', 'Documento de ayuda', '/dashboard/help/doc/<doc_id>/', 'saas/apps/dashboard/help/templates/dashboard/help/pages/doc.html', 'document-text-outline', 'pages/help-document.html', 'current'),

  // Developer
  page('saas', 'Developer', 'modules-overview', 'Resumen developer', '/dashboard/developer/', 'saas/apps/dashboard/developer/templates/developer/pages/overview.html', 'apps-outline', 'pages/modules-overview.html', 'current'),
  page('saas', 'Developer', 'modules-my', 'Mis módulos', '/dashboard/developer/modules/', 'saas/apps/dashboard/developer/templates/developer/pages/my_modules.html', 'cube-outline', 'pages/modules-my.html', 'current'),
  page('saas', 'Developer', 'modules-upload', 'Subir módulo', '/dashboard/developer/modules/upload/', 'saas/apps/dashboard/developer/templates/developer/pages/upload_module.html', 'cloud-upload-outline', 'pages/modules-upload.html', 'current'),
  page('saas', 'Developer', 'modules-edit', 'Editar módulo', '/dashboard/developer/modules/<module_id>/', 'saas/apps/dashboard/developer/templates/developer/pages/edit_module.html', 'create-outline', 'pages/modules-edit.html', 'current'),
  page('saas', 'Developer', 'modules-stats', 'Estadísticas del módulo', '/dashboard/developer/modules/<module_id>/stats/', 'saas/apps/dashboard/developer/templates/developer/pages/module_stats.html', 'stats-chart-outline', 'pages/modules-stats.html', 'current'),
  page('saas', 'Developer', 'modules-members', 'Miembros del módulo', '/dashboard/developer/modules/<module_id>/members/', 'saas/apps/dashboard/developer/templates/developer/pages/module_members.html', 'people-outline', 'pages/modules-members.html', 'current'),
  page('saas', 'Developer', 'modules-repositories', 'Repositorios', '/dashboard/developer/repos/', 'saas/apps/dashboard/commerce/catalog/modules/repository/templates/dashboard/modules/pages/repositories.html', 'git-branch-outline', 'pages/modules-repositories.html', 'current'),
  page('saas', 'Developer', 'modules-add-from-git', 'Añadir desde Git', '/dashboard/developer/repos/add/', 'saas/apps/dashboard/commerce/catalog/modules/repository/templates/dashboard/modules/pages/add_from_git.html', 'logo-github', 'pages/modules-add-from-git.html', 'current'),
  page('saas', 'Developer', 'developer-api-docs', 'API Docs', '/dashboard/developer/apidocs/', 'saas/apps/dashboard/developer/templates/developer/pages/apidocs.html', 'code-slash-outline', 'pages/developer-api-docs.html', 'current'),
  page('saas', 'Developer', 'developer-earnings', 'Ganancias', '/dashboard/developer/earnings/', 'saas/apps/dashboard/developer/templates/developer/pages/earnings.html', 'cash-outline', 'pages/billing-vendor-earnings.html', 'current'),
  page('saas', 'Developer', 'developer-payouts', 'Pagos a vendedores', '/dashboard/developer/payouts/', 'saas/apps/dashboard/developer/templates/developer/pages/payouts.html', 'send-outline', 'pages/billing-payouts.html', 'current'),
  page('saas', 'Developer', 'developer-stripe-connect', 'Stripe Connect', '/dashboard/developer/stripe-connect/', 'saas/apps/dashboard/developer/templates/developer/pages/stripe_connect.html', 'link-outline', 'pages/billing-stripe-connect.html', 'current'),

  // Público y errores: solo superficies que existen hoy; sin storefront inventada.
  page('saas', 'Público', 'public-home', 'Inicio público', '/', 'saas/apps/public/landing/templates/landing/home/index.html', 'globe-outline', 'pages/public-home.html', 'current'),
  page('saas', 'Público', 'public-modules', 'Marketplace público', '/modules/', 'saas/apps/public/modules/templates/modules/pages/index.html', 'storefront-outline', 'pages/public-modules.html', 'current'),
  page('saas', 'Público', 'public-module-detail', 'Módulo público', '/modules/<slug>/', 'saas/apps/public/modules/templates/modules/pages/detail.html', 'cube-outline', 'pages/public-module-detail.html', 'current'),
  page('saas', 'Público', 'public-pricing', 'Precios', '/pricing/', 'saas/apps/public/pricing/templates/pricing/index.html', 'pricetags-outline', 'pages/public-pricing.html', 'current'),
  page('saas', 'Errores', 'errors-404', 'Error 404', '/404', 'saas/templates/404.html', 'help-circle-outline', 'pages/errors-404.html', 'current'),
  page('saas', 'Errores', 'errors-500', 'Error 500', '/500', 'saas/templates/500.html', 'bug-outline', 'pages/errors-500.html', 'current'),
];

export const HUB_PAGES = [
  page('hub', 'Acceso', 'auth-login-hub', 'Iniciar sesión', '/login', 'hub/apps/web/src/views/LoginPage.vue', 'log-in-outline', 'pages/auth-login-hub.html', 'current'),
  page('hub', 'Acceso', 'activation-hub', 'Activación', '/activation', 'hub/apps/web/src/views/ActivationPage.vue', 'key-outline', 'pages/activation-hub.html', 'current'),
  page('hub', 'Principal', 'dashboard-hub', 'Inicio', '/dashboard', 'hub/apps/web/src/views/DashboardPage.vue', 'home-outline', 'pages/dashboard-hub.html', 'current'),
  page('hub', 'Principal', 'employees-list', 'Empleados', '/employees', 'hub/apps/web/src/views/EmployeesPage.vue', 'people-outline', 'pages/employees-list.html', 'current'),
  page('hub', 'Principal', 'employees-add', 'Nuevo empleado', '/employees/new', 'hub/apps/web/src/views/EmployeeFormPage.vue', 'person-add-outline', 'pages/employees-add.html', 'current'),
  page('hub', 'Principal', 'employees-edit', 'Editar empleado', '/employees/:id', 'hub/apps/web/src/views/EmployeeFormPage.vue', 'create-outline', 'pages/employees-edit.html', 'current'),
  page('hub', 'Principal', 'files-hub', 'Archivos', '/files', 'hub/apps/web/src/views/FilesPage.vue', 'folder-outline', 'pages/settings-file-browser.html', 'current'),
  page('hub', 'Cuenta', 'billing-hub', 'Facturación', '/billing', 'hub/apps/web/src/views/BillingPage.vue', 'card-outline', 'pages/billing-hub.html', 'current'),
  page('hub', 'Cuenta', 'apps-hub', 'Aplicaciones', '/apps', 'hub/apps/web/src/views/AppsPage.vue', 'storefront-outline', 'pages/modules-hub-installed.html', 'current'),
  page('hub', 'Cuenta', 'system-index', 'Sistema', '/system', 'hub/apps/web/src/views/SystemPage.vue', 'hardware-chip-outline', 'pages/system-index.html', 'current'),
  page('hub', 'Cuenta', 'api-docs-hub', 'Documentación de la API', '/api-docs', 'hub/apps/web/src/views/ApiDocsPage.vue', 'code-slash-outline', 'pages/api-docs-hub.html', 'current'),
  page('hub', 'Cuenta', 'settings-hub', 'Ajustes', '/settings', 'hub/apps/web/src/views/SettingsPage.vue', 'settings-outline', 'pages/settings-hub.html', 'current'),
  page('hub', 'Módulos', 'module-shell-hub', 'Shell de módulo', '/m/:moduleId/:navId?', 'hub/apps/web/src/views/ModuleView.vue', 'extension-puzzle-outline', 'pages/module-shell-hub.html', 'current'),
];
