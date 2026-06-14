/* pages-data.js — Registro de PÁGINAS DE EJEMPLO del docs-app de OutfitKit.
 *
 * Cada entrada es una pantalla completa («plantilla») que compone ion-* + ok-*
 * para reproducir una vista real de ERPlora (Cloud Portal + Hub), con estructura
 * tomada del prototipo erplora.github.io/ux. Cada página vive en su propio fichero
 * HTML standalone bajo showcase/pages/ y se muestra en un <iframe> dentro del
 * showcase (aislamiento total: cada página carga su propio Ionic + OutfitKit).
 *
 * El router (app.js) las enruta en `#/p/<id>` y la sidebar las agrupa por `group`
 * dentro de la sección plegable «Páginas».
 *
 * Campos: { id, name, file:'pages/<id>.html', icon (ionicons), group }.
 */

export const PAGES = [
  // ── Auth ───────────────────────────────────────────────────────────────────
  { id: 'auth-login-saas',       name: 'Login · SaaS',            file: 'pages/auth-login-saas.html',       icon: 'log-in-outline',         group: 'Auth' },
  { id: 'auth-login-hub',        name: 'Login · Hub',             file: 'pages/auth-login-hub.html',        icon: 'log-in-outline',         group: 'Auth' },
  { id: 'auth-2fa-setup',        name: '2FA · Configurar',        file: 'pages/auth-2fa-setup.html',        icon: 'shield-checkmark-outline', group: 'Auth' },
  { id: 'auth-2fa-profile',      name: '2FA · Perfil',            file: 'pages/auth-2fa-profile.html',      icon: 'shield-outline',         group: 'Auth' },
  { id: 'auth-2fa-disable',      name: '2FA · Desactivar',        file: 'pages/auth-2fa-disable.html',      icon: 'shield-half-outline',    group: 'Auth' },
  { id: 'auth-change-password',  name: 'Cambiar contraseña',      file: 'pages/auth-change-password.html',  icon: 'key-outline',            group: 'Auth' },
  { id: 'auth-sessions',         name: 'Sesiones activas',        file: 'pages/auth-sessions.html',         icon: 'desktop-outline',        group: 'Auth' },
  { id: 'auth-trusted-devices',  name: 'Dispositivos de confianza', file: 'pages/auth-trusted-devices.html', icon: 'phone-portrait-outline', group: 'Auth' },
  { id: 'auth-delete-account',   name: 'Eliminar cuenta',         file: 'pages/auth-delete-account.html',   icon: 'trash-outline',          group: 'Auth' },

  // ── Dashboard & perfil ──────────────────────────────────────────────────────
  { id: 'dashboard-saas',        name: 'Dashboard · SaaS',        file: 'pages/dashboard-saas.html',        icon: 'speedometer-outline',    group: 'Dashboard & perfil' },
  { id: 'dashboard-hub',         name: 'Dashboard · Hub',         file: 'pages/dashboard-hub.html',         icon: 'speedometer-outline',    group: 'Dashboard & perfil' },
  { id: 'profile-saas',          name: 'Perfil · SaaS',           file: 'pages/profile-saas.html',          icon: 'person-circle-outline',  group: 'Dashboard & perfil' },
  { id: 'profile-hub',           name: 'Perfil · Hub',            file: 'pages/profile-hub.html',           icon: 'person-circle-outline',  group: 'Dashboard & perfil' },

  // ── Organizaciones ──────────────────────────────────────────────────────────
  { id: 'orgs-list',             name: 'Organizaciones · Lista',  file: 'pages/orgs-list.html',             icon: 'business-outline',       group: 'Organizaciones' },
  { id: 'orgs-create',           name: 'Organización · Crear',    file: 'pages/orgs-create.html',           icon: 'add-circle-outline',     group: 'Organizaciones' },
  { id: 'orgs-detail',           name: 'Organización · Detalle',  file: 'pages/orgs-detail.html',           icon: 'business-outline',       group: 'Organizaciones' },
  { id: 'orgs-invite',           name: 'Organización · Invitar',  file: 'pages/orgs-invite.html',           icon: 'person-add-outline',     group: 'Organizaciones' },
  { id: 'orgs-billing',          name: 'Organización · Facturación', file: 'pages/orgs-billing.html',       icon: 'card-outline',           group: 'Organizaciones' },
  { id: 'orgs-shipping',         name: 'Organización · Envíos',   file: 'pages/orgs-shipping.html',         icon: 'cube-outline',           group: 'Organizaciones' },
  { id: 'orgs-payment-methods',  name: 'Organización · Métodos de pago', file: 'pages/orgs-payment-methods.html', icon: 'wallet-outline',   group: 'Organizaciones' },

  // ── Hubs ────────────────────────────────────────────────────────────────────
  { id: 'hubs-active',           name: 'Hubs · Activos',          file: 'pages/hubs-active.html',           icon: 'cube-outline',           group: 'Hubs' },
  { id: 'hubs-inactive',         name: 'Hubs · Inactivos',        file: 'pages/hubs-inactive.html',         icon: 'archive-outline',        group: 'Hubs' },
  { id: 'hubs-create',           name: 'Hub · Crear',             file: 'pages/hubs-create.html',           icon: 'add-circle-outline',     group: 'Hubs' },
  { id: 'hubs-settings',         name: 'Hub · Ajustes',           file: 'pages/hubs-settings.html',         icon: 'settings-outline',       group: 'Hubs' },
  { id: 'hubs-users',            name: 'Hub · Usuarios',          file: 'pages/hubs-users.html',            icon: 'people-outline',         group: 'Hubs' },
  { id: 'hubs-modules',          name: 'Hub · Módulos',           file: 'pages/hubs-modules.html',          icon: 'apps-outline',           group: 'Hubs' },
  { id: 'hubs-qr',               name: 'Hub · Acceso QR',         file: 'pages/hubs-qr.html',               icon: 'qr-code-outline',        group: 'Hubs' },

  // ── Usuarios ────────────────────────────────────────────────────────────────
  { id: 'users-list',            name: 'Usuarios · Lista',        file: 'pages/users-list.html',            icon: 'people-outline',         group: 'Usuarios' },
  { id: 'users-invite',          name: 'Usuarios · Invitar',      file: 'pages/users-invite.html',          icon: 'person-add-outline',     group: 'Usuarios' },

  // ── Billing ─────────────────────────────────────────────────────────────────
  { id: 'billing-invoices',         name: 'Facturas',                file: 'pages/billing-invoices.html',         icon: 'receipt-outline',        group: 'Billing' },
  { id: 'billing-invoice-detail',   name: 'Factura · Detalle',       file: 'pages/billing-invoice-detail.html',   icon: 'document-text-outline',  group: 'Billing' },
  { id: 'billing-subscriptions',    name: 'Suscripciones',           file: 'pages/billing-subscriptions.html',    icon: 'repeat-outline',         group: 'Billing' },
  { id: 'billing-purchases',        name: 'Compras',                 file: 'pages/billing-purchases.html',        icon: 'bag-handle-outline',     group: 'Billing' },
  { id: 'billing-payment-history',  name: 'Historial de pagos',      file: 'pages/billing-payment-history.html',  icon: 'time-outline',           group: 'Billing' },
  { id: 'billing-hub',              name: 'Billing · Hub',           file: 'pages/billing-hub.html',              icon: 'card-outline',           group: 'Billing' },
  { id: 'billing-vendor-dashboard', name: 'Vendor · Dashboard',      file: 'pages/billing-vendor-dashboard.html', icon: 'storefront-outline',     group: 'Billing' },
  { id: 'billing-vendor-earnings',  name: 'Vendor · Ganancias',      file: 'pages/billing-vendor-earnings.html',  icon: 'cash-outline',           group: 'Billing' },
  { id: 'billing-payouts',          name: 'Pagos a vendedores',      file: 'pages/billing-payouts.html',          icon: 'send-outline',           group: 'Billing' },
  { id: 'billing-payout-detail',    name: 'Pago · Detalle',          file: 'pages/billing-payout-detail.html',    icon: 'document-text-outline',  group: 'Billing' },
  { id: 'billing-stripe-connect',   name: 'Stripe Connect',          file: 'pages/billing-stripe-connect.html',   icon: 'link-outline',           group: 'Billing' },

  // ── Marketplace ─────────────────────────────────────────────────────────────
  { id: 'marketplace-saas-shop',          name: 'Marketplace SaaS · Tienda',     file: 'pages/marketplace-saas-shop.html',          icon: 'storefront-outline',     group: 'Marketplace' },
  { id: 'marketplace-saas-cart',          name: 'Marketplace SaaS · Carrito',    file: 'pages/marketplace-saas-cart.html',          icon: 'cart-outline',           group: 'Marketplace' },
  { id: 'marketplace-saas-checkout',      name: 'Marketplace SaaS · Checkout',   file: 'pages/marketplace-saas-checkout.html',      icon: 'card-outline',           group: 'Marketplace' },
  { id: 'marketplace-saas-success',       name: 'Marketplace SaaS · Éxito',      file: 'pages/marketplace-saas-success.html',       icon: 'checkmark-circle-outline', group: 'Marketplace' },
  { id: 'marketplace-hub-index',          name: 'Marketplace Hub · Inicio',      file: 'pages/marketplace-hub-index.html',          icon: 'apps-outline',           group: 'Marketplace' },
  { id: 'marketplace-hub-catalog',        name: 'Marketplace Hub · Catálogo',    file: 'pages/marketplace-hub-catalog.html',        icon: 'grid-outline',           group: 'Marketplace' },
  { id: 'marketplace-hub-detail',         name: 'Marketplace Hub · Detalle',     file: 'pages/marketplace-hub-detail.html',         icon: 'information-circle-outline', group: 'Marketplace' },
  { id: 'marketplace-hub-solutions',      name: 'Marketplace Hub · Soluciones',  file: 'pages/marketplace-hub-solutions.html',      icon: 'bulb-outline',           group: 'Marketplace' },
  { id: 'marketplace-hub-business-types', name: 'Marketplace Hub · Tipos de negocio', file: 'pages/marketplace-hub-business-types.html', icon: 'briefcase-outline', group: 'Marketplace' },
  { id: 'marketplace-hub-compliance',     name: 'Marketplace Hub · Cumplimiento', file: 'pages/marketplace-hub-compliance.html',    icon: 'shield-checkmark-outline', group: 'Marketplace' },
  { id: 'marketplace-hub-my-purchases',   name: 'Marketplace Hub · Mis compras', file: 'pages/marketplace-hub-my-purchases.html',   icon: 'bag-check-outline',      group: 'Marketplace' },
  { id: 'marketplace-hub-checkout',       name: 'Marketplace Hub · Checkout',    file: 'pages/marketplace-hub-checkout.html',       icon: 'card-outline',           group: 'Marketplace' },
  { id: 'marketplace-hub-readme',         name: 'Marketplace Hub · README',      file: 'pages/marketplace-hub-readme.html',         icon: 'document-outline',       group: 'Marketplace' },

  // ── Modulos & Developer ─────────────────────────────────────────────────────
  { id: 'modules-overview',      name: 'Módulos · Resumen',       file: 'pages/modules-overview.html',      icon: 'apps-outline',           group: 'Modulos & Developer' },
  { id: 'modules-my',            name: 'Mis módulos',             file: 'pages/modules-my.html',            icon: 'cube-outline',           group: 'Modulos & Developer' },
  { id: 'modules-upload',        name: 'Módulo · Subir',          file: 'pages/modules-upload.html',        icon: 'cloud-upload-outline',   group: 'Modulos & Developer' },
  { id: 'modules-edit',          name: 'Módulo · Editar',         file: 'pages/modules-edit.html',          icon: 'create-outline',         group: 'Modulos & Developer' },
  { id: 'modules-stats',         name: 'Módulo · Estadísticas',   file: 'pages/modules-stats.html',         icon: 'stats-chart-outline',    group: 'Modulos & Developer' },
  { id: 'modules-members',       name: 'Módulo · Miembros',       file: 'pages/modules-members.html',       icon: 'people-outline',         group: 'Modulos & Developer' },
  { id: 'modules-repositories',  name: 'Repositorios',            file: 'pages/modules-repositories.html',  icon: 'git-branch-outline',     group: 'Modulos & Developer' },
  { id: 'modules-add-from-git',  name: 'Añadir desde Git',        file: 'pages/modules-add-from-git.html',  icon: 'logo-github',            group: 'Modulos & Developer' },
  { id: 'modules-hub-installed', name: 'Módulos instalados · Hub', file: 'pages/modules-hub-installed.html', icon: 'checkmark-done-outline', group: 'Modulos & Developer' },

  // ── Empleados & roles ───────────────────────────────────────────────────────
  { id: 'employees-list',        name: 'Empleados · Lista',       file: 'pages/employees-list.html',        icon: 'people-outline',         group: 'Empleados & roles' },
  { id: 'employees-add',         name: 'Empleado · Añadir',       file: 'pages/employees-add.html',         icon: 'person-add-outline',     group: 'Empleados & roles' },
  { id: 'employees-edit',        name: 'Empleado · Editar',       file: 'pages/employees-edit.html',        icon: 'create-outline',         group: 'Empleados & roles' },
  { id: 'roles-list',            name: 'Roles · Lista',           file: 'pages/roles-list.html',            icon: 'ribbon-outline',         group: 'Empleados & roles' },
  { id: 'roles-form',            name: 'Rol · Formulario',        file: 'pages/roles-form.html',            icon: 'create-outline',         group: 'Empleados & roles' },
  { id: 'roles-detail',          name: 'Rol · Detalle',           file: 'pages/roles-detail.html',          icon: 'ribbon-outline',         group: 'Empleados & roles' },
  { id: 'roles-confirm-delete',  name: 'Rol · Confirmar borrado', file: 'pages/roles-confirm-delete.html',  icon: 'trash-outline',          group: 'Empleados & roles' },

  // ── Settings ────────────────────────────────────────────────────────────────
  { id: 'settings-preferences',     name: 'Preferencias',            file: 'pages/settings-preferences.html',     icon: 'options-outline',        group: 'Settings' },
  { id: 'settings-hub',             name: 'Ajustes · Hub',           file: 'pages/settings-hub.html',             icon: 'settings-outline',       group: 'Settings' },
  { id: 'settings-hub-config',      name: 'Configuración del Hub',   file: 'pages/settings-hub-config.html',       icon: 'construct-outline',      group: 'Settings' },
  { id: 'settings-compliance',      name: 'Cumplimiento',            file: 'pages/settings-compliance.html',       icon: 'shield-checkmark-outline', group: 'Settings' },
  { id: 'settings-devices',         name: 'Dispositivos',            file: 'pages/settings-devices.html',         icon: 'hardware-chip-outline',  group: 'Settings' },
  { id: 'settings-printers',        name: 'Impresoras',              file: 'pages/settings-printers.html',         icon: 'print-outline',          group: 'Settings' },
  { id: 'settings-backup',          name: 'Copias de seguridad',     file: 'pages/settings-backup.html',           icon: 'cloud-done-outline',     group: 'Settings' },
  { id: 'settings-file-browser',    name: 'Explorador de archivos',  file: 'pages/settings-file-browser.html',     icon: 'folder-open-outline',    group: 'Settings' },
  { id: 'settings-tax-classes',     name: 'Clases de impuestos',     file: 'pages/settings-tax-classes.html',      icon: 'pricetags-outline',      group: 'Settings' },
  { id: 'settings-files',           name: 'Archivos',                file: 'pages/settings-files.html',            icon: 'documents-outline',      group: 'Settings' },
  { id: 'settings-help',            name: 'Ayuda',                   file: 'pages/settings-help.html',             icon: 'help-circle-outline',    group: 'Settings' },
  { id: 'settings-scheduled-tasks', name: 'Tareas programadas',      file: 'pages/settings-scheduled-tasks.html',  icon: 'calendar-outline',       group: 'Settings' },

  // ── Sistema & publico ───────────────────────────────────────────────────────
  { id: 'system-index',          name: 'Sistema',                 file: 'pages/system-index.html',          icon: 'pulse-outline',          group: 'Sistema & publico' },
  { id: 'system-bridge-setup',   name: 'Bridge · Configuración',  file: 'pages/system-bridge-setup.html',   icon: 'git-network-outline',    group: 'Sistema & publico' },
  { id: 'public-index',          name: 'Público · Inicio',        file: 'pages/public-index.html',          icon: 'globe-outline',          group: 'Sistema & publico' },
  { id: 'public-catalog',        name: 'Público · Catálogo',      file: 'pages/public-catalog.html',        icon: 'grid-outline',           group: 'Sistema & publico' },
  { id: 'public-product',        name: 'Público · Producto',      file: 'pages/public-product.html',        icon: 'pricetag-outline',       group: 'Sistema & publico' },

  // ── Errores ─────────────────────────────────────────────────────────────────
  { id: 'errors-403',              name: 'Error 403',               file: 'pages/errors-403.html',              icon: 'lock-closed-outline',    group: 'Errores' },
  { id: 'errors-404',              name: 'Error 404',               file: 'pages/errors-404.html',              icon: 'help-circle-outline',    group: 'Errores' },
  { id: 'errors-405',              name: 'Error 405',               file: 'pages/errors-405.html',              icon: 'ban-outline',            group: 'Errores' },
  { id: 'errors-500',              name: 'Error 500',               file: 'pages/errors-500.html',              icon: 'bug-outline',            group: 'Errores' },
  { id: 'errors-bootstrap',        name: 'Bootstrap · Error',       file: 'pages/errors-bootstrap.html',        icon: 'warning-outline',        group: 'Errores' },
  { id: 'errors-bootstrap-detail', name: 'Bootstrap · Detalle',     file: 'pages/errors-bootstrap-detail.html',  icon: 'list-outline',           group: 'Errores' },
  { id: 'errors-unauthorized',     name: 'No autorizado',           file: 'pages/errors-unauthorized.html',     icon: 'lock-closed-outline',    group: 'Errores' },
];
