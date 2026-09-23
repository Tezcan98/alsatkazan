import { CAR_PART_DEFS, PART_STATUS } from '../data/constants.js';

// =====================================================================
//  BOYA / DEĞİŞEN ŞEMASI (Görünüm katmanı) — sahibinden.com tarzı
// =====================================================================
// Üstten görünüm gerçekçi bir araç silueti: yuvarlatılmış tampon uçları,
// ön/arka cam, kaporta panelleri (kaput/tavan/bagaj) ve yanlarda
// çamurluk + kapılar, aralarında lastik boşluğu (wheel well) çentikleri
// ile birlikte çizilir. Her panel kendi durumuna (orijinal/boyalı/
// değişen) göre renklendirilir; tooltip ve lejant korunur.
var SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

function panel(tag, attrs, part){
  var sd = PART_STATUS[part.status];
  var shape = el(tag, Object.assign({
    fill: sd.color,
    opacity: part.status==='orijinal' ? '0.5' : '0.92',
    stroke: '#26313d', 'stroke-width': '1.2', 'stroke-linejoin':'round'
  }, attrs));
  var title = document.createElementNS(SVG_NS, 'title');
  title.textContent = part.label + ' — ' + sd.label;
  shape.appendChild(title);
  return shape;
}

// ---- geometri sabitleri (viewBox 0 0 180 260, ön üstte) ----
var BL = 16, BR = 164;      // gövde dış sınırı
var RL = 46, RR = 134;      // kabin (tavan) iç sınırı
var FB_TOP = 6, FB_BOT = 32;        // ön tampon
var HOOD_TOP = 32, HOOD_BOT = 64;   // kaput
var WSF_TOP = 64, WSF_BOT = 82;     // ön cam
var FENDER_TOP = 46, FENDER_BOT = 90;    // ön çamurluk
var WHEEL_F_TOP = 90, WHEEL_F_BOT = 116; // ön lastik boşluğu
var DOOR_F_TOP = 116, DOOR_F_BOT = 152;  // ön kapı
var ROOF_TOP = 82, ROOF_BOT = 176;       // tavan
var DOOR_R_TOP = 152, DOOR_R_BOT = 194;  // arka kapı
var WHEEL_R_TOP = 194, WHEEL_R_BOT = 220; // arka lastik boşluğu
var WSR_TOP = 176, WSR_BOT = 194;   // arka cam
var TRUNK_TOP = 194, TRUNK_BOT = 224;   // bagaj
var RB_TOP = 224, RB_BOT = 250;         // arka tampon

function frontBumperPath(){
  return 'M ' + (BL+12) + ' ' + FB_BOT + ' L ' + (BL+6) + ' ' + (FB_TOP+16) +
    ' Q ' + (BL+6) + ' ' + FB_TOP + ' ' + (BL+26) + ' ' + FB_TOP +
    ' L ' + (BR-26) + ' ' + FB_TOP +
    ' Q ' + (BR-6) + ' ' + FB_TOP + ' ' + (BR-6) + ' ' + (FB_TOP+16) +
    ' L ' + (BR-12) + ' ' + FB_BOT + ' Z';
}
function rearBumperPath(){
  return 'M ' + (BL+12) + ' ' + RB_TOP + ' L ' + (BR-12) + ' ' + RB_TOP +
    ' L ' + (BR-6) + ' ' + (RB_BOT-16) +
    ' Q ' + (BR-6) + ' ' + RB_BOT + ' ' + (BR-26) + ' ' + RB_BOT +
    ' L ' + (BL+26) + ' ' + RB_BOT +
    ' Q ' + (BL+6) + ' ' + RB_BOT + ' ' + (BL+6) + ' ' + (RB_BOT-16) + ' Z';
}
function hoodPath(){
  return 'M ' + (BL+16) + ' ' + HOOD_TOP + ' L ' + (BR-16) + ' ' + HOOD_TOP +
    ' L ' + (BR-6) + ' ' + HOOD_BOT + ' L ' + (BL+6) + ' ' + HOOD_BOT + ' Z';
}
function trunkPath(){
  return 'M ' + (BL+6) + ' ' + TRUNK_TOP + ' L ' + (BR-6) + ' ' + TRUNK_TOP +
    ' L ' + (BR-16) + ' ' + TRUNK_BOT + ' L ' + (BL+16) + ' ' + TRUNK_BOT + ' Z';
}
function fenderPath(side){
  // side: 'sol' (left) ya da 'sag' (right)
  if(side==='sol'){
    return 'M ' + BL + ' ' + (FENDER_TOP+10) +
      ' Q ' + BL + ' ' + FENDER_TOP + ' ' + (BL+14) + ' ' + FENDER_TOP +
      ' L ' + RL + ' ' + FENDER_TOP + ' L ' + RL + ' ' + FENDER_BOT +
      ' L ' + (BL+6) + ' ' + FENDER_BOT +
      ' Q ' + BL + ' ' + FENDER_BOT + ' ' + BL + ' ' + (FENDER_BOT-10) + ' Z';
  }
  return 'M ' + BR + ' ' + (FENDER_TOP+10) +
    ' Q ' + BR + ' ' + FENDER_TOP + ' ' + (BR-14) + ' ' + FENDER_TOP +
    ' L ' + RR + ' ' + FENDER_TOP + ' L ' + RR + ' ' + FENDER_BOT +
    ' L ' + (BR-6) + ' ' + FENDER_BOT +
    ' Q ' + BR + ' ' + FENDER_BOT + ' ' + BR + ' ' + (FENDER_BOT-10) + ' Z';
}

export function buildCarPartsDiagram(car){
  var wrap = document.createElement('div');
  wrap.className = 'parts-diagram-wrap';

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 180 260');
  svg.setAttribute('class', 'parts-diagram-svg');

  function status(key){ return car.partStatus ? (car.partStatus[key] || 'orijinal') : 'orijinal'; }
  function def(key){ return CAR_PART_DEFS.find(function(p){ return p.key===key; }) || {label:key}; }
  function part(key){ return { key:key, label:def(key).label, status:status(key) }; }

  // ---- taban silüeti (gövde gölgesi) ----
  var shadow = el('path', {
    d: 'M ' + (BL+10) + ' ' + FB_TOP +
       ' Q ' + BL + ' ' + FB_TOP + ' ' + BL + ' ' + (FB_TOP+18) +
       ' L ' + BL + ' ' + (RB_BOT-18) +
       ' Q ' + BL + ' ' + RB_BOT + ' ' + (BL+10) + ' ' + RB_BOT +
       ' L ' + (BR-10) + ' ' + RB_BOT +
       ' Q ' + BR + ' ' + RB_BOT + ' ' + BR + ' ' + (RB_BOT-18) +
       ' L ' + BR + ' ' + (FB_TOP+18) +
       ' Q ' + BR + ' ' + FB_TOP + ' ' + (BR-10) + ' ' + FB_TOP + ' Z',
    fill: '#eef1f3', stroke: '#c7cfd6', 'stroke-width': '1'
  });
  svg.appendChild(shadow);

  // ---- lastik boşlukları (wheel wells) — koyu çentikler ----
  [ [BL-1, (WHEEL_F_TOP+WHEEL_F_BOT)/2], [BR+1, (WHEEL_F_TOP+WHEEL_F_BOT)/2],
    [BL-1, (WHEEL_R_TOP+WHEEL_R_BOT)/2], [BR+1, (WHEEL_R_TOP+WHEEL_R_BOT)/2] ].forEach(function(p){
    svg.appendChild(el('ellipse', { cx:p[0], cy:p[1], rx:10, ry:14, fill:'#20262b' }));
  });

  // ---- ön / arka cam (boyanamayan sabit alanlar) ----
  svg.appendChild(el('path', {
    d: 'M ' + (BL+10) + ' ' + WSF_BOT + ' L ' + (BR-10) + ' ' + WSF_BOT + ' L ' + (RR-2) + ' ' + WSF_TOP + ' L ' + (RL+2) + ' ' + WSF_TOP + ' Z',
    fill:'#b9cbd6', opacity:'0.85', stroke:'#8fa6b3', 'stroke-width':'1'
  }));
  svg.appendChild(el('path', {
    d: 'M ' + (RL+2) + ' ' + WSR_BOT + ' L ' + (RR-2) + ' ' + WSR_BOT + ' L ' + (BR-10) + ' ' + WSR_TOP + ' L ' + (BL+10) + ' ' + WSR_TOP + ' Z',
    fill:'#b9cbd6', opacity:'0.85', stroke:'#8fa6b3', 'stroke-width':'1'
  }));

  // ---- boyanabilir paneller ----
  svg.appendChild(panel('path', { d: frontBumperPath() }, part('on-tampon')));
  svg.appendChild(panel('path', { d: hoodPath() }, part('kaput')));
  svg.appendChild(panel('rect', { x:RL, y:ROOF_TOP, width:(RR-RL), height:(ROOF_BOT-ROOF_TOP), rx:14 }, part('tavan')));
  svg.appendChild(panel('path', { d: trunkPath() }, part('bagaj')));
  svg.appendChild(panel('path', { d: rearBumperPath() }, part('arka-tampon')));
  svg.appendChild(panel('path', { d: fenderPath('sol') }, part('sol-on-camurluk')));
  svg.appendChild(panel('path', { d: fenderPath('sag') }, part('sag-on-camurluk')));
  svg.appendChild(panel('rect', { x:BL, y:DOOR_F_TOP, width:(RL-BL), height:(DOOR_F_BOT-DOOR_F_TOP), rx:3 }, part('sol-on-kapi')));
  svg.appendChild(panel('rect', { x:RR, y:DOOR_F_TOP, width:(BR-RR), height:(DOOR_F_BOT-DOOR_F_TOP), rx:3 }, part('sag-on-kapi')));
  svg.appendChild(panel('rect', { x:BL, y:DOOR_R_TOP, width:(RL-BL), height:(DOOR_R_BOT-DOOR_R_TOP), rx:3 }, part('sol-arka-kapi')));
  svg.appendChild(panel('rect', { x:RR, y:DOOR_R_TOP, width:(BR-RR), height:(DOOR_R_BOT-DOOR_R_TOP), rx:3 }, part('sag-arka-kapi')));

  wrap.appendChild(svg);

  var legend = document.createElement('div');
  legend.className = 'parts-legend';
  Object.keys(PART_STATUS).forEach(function(key){
    var sd = PART_STATUS[key];
    var chip = document.createElement('span');
    chip.className = 'parts-legend-chip';
    chip.innerHTML = '<i style="background:' + sd.color + '"></i>' + sd.label;
    legend.appendChild(chip);
  });
  wrap.appendChild(legend);

  var affected = CAR_PART_DEFS.filter(function(p){
    var st = car.partStatus ? car.partStatus[p.key] : 'orijinal';
    return st && st !== 'orijinal';
  });
  if(affected.length > 0){
    var list = document.createElement('div');
    list.className = 'parts-list-text';
    list.textContent = affected.map(function(p){
      var st = car.partStatus[p.key];
      return p.label + ' (' + PART_STATUS[st].label + ')';
    }).join(' · ');
    wrap.appendChild(list);
  } else {
    var clean = document.createElement('div');
    clean.className = 'parts-list-text';
    clean.textContent = 'Tüm kaporta parçaları orijinal.';
    wrap.appendChild(clean);
  }

  return wrap;
}
