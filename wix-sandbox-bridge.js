// Wix HTML components can use a sandbox origin different from the public site.
// Only the immediate embedding window may send bridge replies. Wix web methods
// and the API independently authorize every data operation.
(function installWixSandboxBridge() {
  if (window.parent === window) return;
  postToWix = function (type, extra = {}) {
    window.parent.postMessage({ source: 'jpdb-organizer', type, ...extra }, '*');
    return true;
  };
  window.removeEventListener('message', receiveWixMessage);
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.source !== 'jpdb-wix') return;
    ALLOWED_WIX_ORIGINS.add(event.origin);
    receiveWixMessage(event);
  });
  postToWix(MESSAGE_TYPES.authRequest);
})();
