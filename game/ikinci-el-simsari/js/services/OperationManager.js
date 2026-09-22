import { clamp, pick, toast } from '../utils.js';
import { AMBIENT_EVENTS } from '../data/constants.js';

// =====================================================================
//  İŞLEM SÜRE YÖNETİCİSİ — "işlem sürüyor" durumunu ve gecikmeyi yönetir
// =====================================================================
// İşlem sürerken oyuncu KİLİTLENMEZ: sekmeler arasında gezinip başka
// ilanlara bakabilir, mesajlaşabilir — sadece yeni bir ücretli işlem
// başlatamaz (Controller bunu ayrıca kontrol eder). Bekleme sırasında
// alt bar bir ilerleme noktası gösterir, üstte de akan bir "olan biten"
// bildirimiyle oyalanacak içerik sunulur.
export var OperationManager = {
  active: false,
  root: null,
  currentDesc: null,
  init: function(){ this.root = document.getElementById('busyRoot'); },
  isBusy: function(){ return this.active; },
  run: function(desc, effectFn){
    if(this.active) return;
    this.active = true;
    this.currentDesc = desc;
    var self = this;
    var total = desc.durationMs;
    var startedAt = Date.now();
    var phases = desc.phases && desc.phases.length ? desc.phases : [desc.title + ' işleniyor…'];

    var bar = document.createElement('div');
    bar.className = 'busybar';
    var spin = document.createElement('div'); spin.className = 'spin';
    var textWrap = document.createElement('div'); textWrap.className = 'bblabel';
    var label = document.createElement('div');
    label.textContent = phases[0];
    var subLabel = document.createElement('div');
    subLabel.style.fontSize = '0.68rem';
    subLabel.style.opacity = '0.75';
    subLabel.textContent = desc.title + ' — kalan süre hesaplanıyor…';
    textWrap.appendChild(label);
    textWrap.appendChild(subLabel);
    var track = document.createElement('div'); track.className = 'bbtrack';
    var fill = document.createElement('div'); fill.className = 'bbfill';
    track.appendChild(fill);
    bar.appendChild(spin); bar.appendChild(textWrap); bar.appendChild(track);
    this.root.innerHTML = '';
    this.root.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add('show'); });
    markNavBusy(true);

    var phaseIdx = 0;
    var iv = setInterval(function(){
      var elapsed = Date.now()-startedAt;
      var pct = clamp(elapsed/total*100, 0, 100);
      fill.style.width = pct + '%';
      var remainSec = Math.max(0, Math.ceil((total-elapsed)/1000));
      subLabel.textContent = desc.title + ' — kalan ≈ ' + remainSec + ' sn (oyun-içi ' + (desc.durationLabel||'') + ')';
      var wantIdx = Math.min(phases.length-1, Math.floor((elapsed/total) * phases.length));
      if(wantIdx !== phaseIdx){ phaseIdx = wantIdx; label.textContent = phases[phaseIdx]; }
    }, 200);

    // Bekleme sırasında oyalanacak kozmetik "piyasa haberi" bildirimleri.
    var ambientTimers = [];
    if(total >= 6000){
      var ambientCount = total >= 18000 ? 2 : 1;
      for(var a=0; a<ambientCount; a++){
        var when = total * (0.3 + Math.random()*0.55);
        ambientTimers.push(setTimeout(function(){
          toast('Haber: ' + pick(AMBIENT_EVENTS));
        }, when));
      }
    }

    setTimeout(function(){
      clearInterval(iv);
      ambientTimers.forEach(clearTimeout);
      bar.classList.remove('show');
      setTimeout(function(){ if(bar.parentNode) bar.parentNode.removeChild(bar); }, 200);
      self.active = false;
      self.currentDesc = null;
      markNavBusy(false);
      effectFn();
    }, total);
  }
};

// Bekleme sırasında sekmeler ve ilan gezintisi tamamen açık kalır —
// sadece alt barda küçük bir "arka planda işlem var" işareti gösterilir.
function markNavBusy(busy){
  var nav = document.getElementById('bottombar');
  if(!nav) return;
  nav.classList.toggle('nav-busy', busy);
}
