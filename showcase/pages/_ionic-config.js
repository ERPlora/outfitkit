// ERPlora usa una sola apariencia Ionic en web, móvil y escritorio.
window.Ionic = {
  ...(window.Ionic || {}),
  config: {
    ...(window.Ionic?.config || {}),
    mode: 'ios',
  },
};
