// Code de pont Wix ↔ embed organisateur.
// Le composant HTML Wix de la page organisateur a pour ID : #organizerEmbed

import { currentMember } from 'wix-members-frontend';

const HTML_COMPONENT_ID = '#organizerEmbed';

$w.onReady(() => {
  const html = $w(HTML_COMPONENT_ID);

  html.onMessage(async (event) => {
    if (!event?.data || event.data.type !== 'JPDB_ORGANIZER_EMBED_READY') {
      return;
    }

    try {
      const member = await currentMember.getMember();

      if (!member) {
        html.postMessage({
          type: 'JPDB_WIX_MEMBER_AUTH',
          loggedIn: false,
          roles: [],
          isOrganisateur: false,
        });
        return;
      }

      const roles = await currentMember.getRoles();
      const roleNames = Array.isArray(roles)
        ? roles.map((role) => String(role?.name || '').trim()).filter(Boolean)
        : [];

      const normalized = roleNames.map((name) => name.toLowerCase());
      const isOrganisateur = normalized.includes('organisateur') || normalized.includes('admin');

      console.log('JPDB membre Wix:', member._id);
      console.log('JPDB rôles Wix:', roleNames);

      html.postMessage({
        type: 'JPDB_WIX_MEMBER_AUTH',
        loggedIn: true,
        roles: roleNames,
        isOrganisateur,
      });
    } catch (error) {
      console.error('JPDB erreur lecture rôles Wix:', error);
      html.postMessage({
        type: 'JPDB_WIX_MEMBER_AUTH',
        loggedIn: true,
        roles: [],
        isOrganisateur: false,
        error: String(error?.message || error),
      });
    }
  });
});
