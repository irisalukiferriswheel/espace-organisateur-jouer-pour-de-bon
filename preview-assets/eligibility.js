/* Public API has city labels and game slug/nameFr/nameEn, not canonical city IDs. */
window.InvitationEligibility=Object.freeze({
 normalize(value){return typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-CA'):'';},
 matches(player,city,game){
  const normalize=this.normalize,requiredCity=normalize(city),requiredGame=normalize(game);
  if(!requiredCity||!requiredGame||normalize(player?.city)!==requiredCity||!Array.isArray(player?.games))return false;
  return player.games.some(interest=>interest&&typeof interest==='object'&&[interest.slug,interest.nameFr,interest.nameEn].some(label=>normalize(label)===requiredGame));
 }
});
