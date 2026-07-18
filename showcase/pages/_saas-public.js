function ensureStyle() {
  if (document.head.querySelector('[data-saas-public]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./_saas-public.css', import.meta.url).href;
  link.setAttribute('data-saas-public', '');
  document.head.append(link);
}

export function defineSaasPublicPage({ body = '', setup } = {}) {
  ensureStyle();
  document.body.innerHTML = `<ion-app class="public-shell"><ion-header class="ion-no-border"><ion-toolbar>
    <a slot="start" class="public-brand" href="#/p/public-home">ERPlora</a>
    <div slot="end" class="public-nav"><ion-button fill="clear" href="#/p/public-modules">Módulos</ion-button><ion-button fill="clear" href="#/p/public-pricing">Precios</ion-button><ion-button class="public-login" fill="outline" href="#/p/auth-login-saas">Entrar</ion-button></div>
  </ion-toolbar></ion-header><ion-content class="public-main">${body}</ion-content><ion-footer class="ion-no-border"><ion-toolbar><ion-note>ERPlora · Un ERP modular para cada negocio</ion-note></ion-toolbar></ion-footer></ion-app>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { if (typeof setup === 'function') setup(document); }));
}
