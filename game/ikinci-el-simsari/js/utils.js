// =====================================================================
//  YARDIMCILAR
// =====================================================================
export function rnd(min,max){ return Math.floor(min + Math.random()*(max-min)); }
export function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
export function fmt(n){ return Math.round(n).toLocaleString('tr-TR') + ' ₺'; }
export function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

var _uidCounter = 0;
export function uid(){ return ++_uidCounter; }

export function toast(msg){
  var el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, 1900);
}
