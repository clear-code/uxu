(function () {
  var ns = {};
  Components.utils.import('resource://uxu-modules/lib/prefs.js', ns);

  if ("AutoConfigWizard" in window &&
      ns.prefs.getPref('extensions.uxu.profile.suppressAutoConfigWizard')) {
    window.AutoConfigWizard = function () {};
  }
})();
