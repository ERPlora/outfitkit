#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

// Solo las demos reconstruidas y verificadas viven aquí. El resto del catálogo sigue
// apuntando directamente al Web Component real del módulo, sin duplicar su UI.
const PAGE_OVERRIDES = {
  'module-appointments-appointments': {
    file: 'pages/module-appointments.html',
    parity: 'current',
  },
  'module-backup-backup': {
    file: 'pages/module-backup-backup.html',
    parity: 'current',
  },
  'module-backup-settings': {
    file: 'pages/module-backup-settings.html',
    parity: 'current',
  },
  'module-cart-checkout-carts': {
    file: 'pages/module-cart-checkout-carts.html',
    parity: 'current',
  },
  'module-cart-checkout-orders': {
    file: 'pages/module-cart-checkout-orders.html',
    parity: 'current',
  },
  'module-cash-register-cash-register': {
    file: 'pages/module-cash-register.html',
    parity: 'current',
  },
  'module-customers-customers': {
    file: 'pages/module-customers-list.html',
    parity: 'current',
  },
  'module-customers-groups': {
    file: 'pages/module-customers-groups.html',
    parity: 'current',
  },
  'module-customers-tags': {
    file: 'pages/module-customers-tags.html',
    parity: 'current',
  },
  'module-customers-fields': {
    file: 'pages/module-customers-fields.html',
    parity: 'current',
  },
  'module-invoice-invoice': {
    file: 'pages/module-invoice-list.html',
    parity: 'current',
  },
  'module-invoice-settings': {
    file: 'pages/module-invoice-settings.html',
    parity: 'current',
  },
  'module-invoice-series-list': {
    file: 'pages/module-invoice-series-list.html',
    parity: 'current',
  },
  'module-inventory-products': {
    file: 'pages/module-inventory-products.html',
    parity: 'current',
  },
  'module-inventory-dashboard': {
    file: 'pages/module-inventory-dashboard.html',
    parity: 'current',
  },
  'module-inventory-categories': {
    file: 'pages/module-inventory-categories.html',
    parity: 'current',
  },
  'module-kitchen-display': {
    file: 'pages/module-kitchen-display.html',
    parity: 'current',
  },
  'module-kitchen-active': {
    file: 'pages/module-kitchen-active.html',
    parity: 'current',
  },
  'module-kitchen-stations': {
    file: 'pages/module-kitchen-stations.html',
    parity: 'current',
  },
  'module-online-booking-bookings': {
    file: 'pages/module-online-booking-bookings.html',
    parity: 'current',
  },
  'module-online-booking-settings': {
    file: 'pages/module-online-booking-settings.html',
    parity: 'current',
  },
  'module-payment-gateways-gateways': {
    file: 'pages/module-payment-gateways.html',
    parity: 'current',
  },
  'module-payments-list': {
    file: 'pages/module-payments-list.html',
    parity: 'current',
  },
  'module-reservations-list': {
    file: 'pages/module-reservations-list.html',
    parity: 'current',
  },
  'module-reservations-waitlist': {
    file: 'pages/module-reservations-waitlist.html',
    parity: 'current',
  },
  'module-reservations-availability': {
    file: 'pages/module-reservations-availability.html',
    parity: 'current',
  },
  'module-pricing-lists': {
    file: 'pages/module-pricing-lists.html',
    parity: 'current',
  },
  'module-printing-printing': {
    file: 'pages/module-printing-printing.html',
    parity: 'current',
  },
  'module-printing-routing': {
    file: 'pages/module-printing-routing.html',
    parity: 'current',
  },
  'module-sales-sales': {
    file: 'pages/module-sales-list.html',
    parity: 'current',
  },
  'module-sales-pos': {
    file: 'pages/module-sales-pos.html',
    parity: 'current',
  },
  'module-schedules-hours': {
    file: 'pages/module-schedules-hours.html',
    parity: 'current',
  },
  'module-services-services': {
    file: 'pages/module-services.html',
    parity: 'current',
  },
  'module-staff-staff': {
    file: 'pages/module-staff-members.html',
    parity: 'current',
  },
  'module-staff-roles': {
    file: 'pages/module-staff-roles.html',
    parity: 'current',
  },
  'module-staff-time-off': {
    file: 'pages/module-staff-time-off.html',
    parity: 'current',
  },
  'module-staff-schedules': {
    file: 'pages/module-staff-schedules.html',
    parity: 'current',
  },
  'module-tables-floor-plan': {
    file: 'pages/module-tables-floor-plan.html',
    parity: 'current',
  },
  'module-tables-zones': {
    file: 'pages/module-tables-zones.html',
    parity: 'current',
  },
  'module-tasks-all': {
    file: 'pages/module-tasks-list.html',
    parity: 'current',
  },
  'module-tasks-projects': {
    file: 'pages/module-tasks-projects.html',
    parity: 'current',
  },
  'module-taxes-categories': {
    file: 'pages/module-taxes-categories.html',
    parity: 'current',
  },
  'module-taxes-rules': {
    file: 'pages/module-taxes-rules.html',
    parity: 'current',
  },
  'module-taxes-aliases': {
    file: 'pages/module-taxes-aliases.html',
    parity: 'current',
  },
  'module-tickets-list': {
    file: 'pages/module-tickets-list.html',
    parity: 'current',
  },
  'module-tickets-sla': {
    file: 'pages/module-tickets-sla.html',
    parity: 'current',
  },
  'module-verifactu-records': {
    file: 'pages/module-verifactu-records.html',
    parity: 'current',
  },
  'module-verifactu-contingency': {
    file: 'pages/module-verifactu-contingency.html',
    parity: 'current',
  },
  'module-verifactu-events': {
    file: 'pages/module-verifactu-events.html',
    parity: 'current',
  },
  'module-verifactu-recovery': {
    file: 'pages/module-verifactu-recovery.html',
    parity: 'current',
  },
  'module-verifactu-settings': {
    file: 'pages/module-verifactu-settings.html',
    parity: 'current',
  },
  'module-whatsapp-inbox-inbox': {
    file: 'pages/module-whatsapp-inbox-inbox.html',
    parity: 'current',
  },
  'module-whatsapp-inbox-requests': {
    file: 'pages/module-whatsapp-inbox-requests.html',
    parity: 'current',
  },
  'module-whatsapp-inbox-templates': {
    file: 'pages/module-whatsapp-inbox-templates.html',
    parity: 'current',
  },
};

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Falta el valor de ${name}`);
  }
  return resolve(process.cwd(), value);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function requiredString(value, context) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context} debe ser un string no vacío`);
  }
  return value;
}

function localizedLabel(locale, navId, fallback) {
  const label = locale?.navigation?.[navId]?.label;
  return typeof label === 'string' && label.trim() !== '' ? label : fallback;
}

function publicId(moduleId, navId) {
  const slug = `${moduleId}-${navId}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `module-${slug}`;
}

function generatePages(modulesDirectory) {
  const pages = [];
  const seenComponents = new Set();

  const directories = readdirSync(modulesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));

  for (const directory of directories) {
    const moduleDirectory = resolve(modulesDirectory, directory.name);
    const manifestPath = resolve(moduleDirectory, 'module.json');

    // El runtime aplica la misma regla: un directorio sin module.json no es un módulo
    // instalable. Esto excluye copias archivadas como kitchen_orders y sus componentes.
    if (!existsSync(manifestPath)) continue;

    const manifest = readJson(manifestPath);
    const moduleId = requiredString(manifest.id, `${manifestPath}: id`);
    const moduleName = requiredString(manifest.name, `${manifestPath}: name`);
    const navigation = Array.isArray(manifest.navigation) ? manifest.navigation : [];
    const localePath = resolve(moduleDirectory, 'locales', 'es.json');
    const locale = existsSync(localePath) ? readJson(localePath) : {};
    const section = typeof locale.name === 'string' && locale.name.trim() !== '' ? locale.name : moduleName;

    for (const navigationEntry of navigation) {
      const navId = requiredString(navigationEntry?.id, `${manifestPath}: navigation.id`);
      const component = requiredString(navigationEntry?.component, `${manifestPath}: navigation.${navId}.component`);
      const fallbackName = requiredString(navigationEntry?.label, `${manifestPath}: navigation.${navId}.label`);

      // Un mismo WC declarado por varias rutas no se convierte en varias demos idénticas.
      // La primera entrada del manifest es la canónica y conserva su navId, icono y ruta.
      if (seenComponents.has(component)) continue;
      seenComponents.add(component);

      const componentSource = resolve(moduleDirectory, 'ui', 'components', component, `${component}.ts`);
      if (!existsSync(componentSource)) {
        throw new Error(`${manifestPath}: no existe el componente navegable ${componentSource}`);
      }

      const id = publicId(moduleId, navId);
      pages.push({
        id,
        name: localizedLabel(locale, navId, fallbackName),
        icon: typeof navigationEntry.icon === 'string' && navigationEntry.icon !== ''
          ? navigationEntry.icon
          : 'extension-puzzle-outline',
        surface: 'modules',
        section,
        moduleId,
        navId,
        component,
        source: `modules-workspace/modules/${directory.name}/ui/components/${component}/${component}.ts`,
        route: `/m/${moduleId}/${navId}`,
        parity: 'source',
        ...(PAGE_OVERRIDES[id] || {}),
      });
    }
  }

  return pages;
}

const modulesDirectory = argumentValue(
  '--modules-dir',
  resolve(scriptDirectory, '../../modules-workspace/modules'),
);
const outputFile = argumentValue(
  '--out',
  resolve(scriptDirectory, '../showcase/module-pages-data.js'),
);
const pages = generatePages(modulesDirectory);
const generatedSource = `/* Este archivo se genera con pnpm generate:module-pages. No editar a mano. */\n\nexport const MODULE_PAGES = ${JSON.stringify(pages, null, 2)};\n`;

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, generatedSource);
console.log(`Generadas ${pages.length} páginas reales de módulos en ${outputFile}`);
