import { CAR_PART_DEFS, PART_STATUS } from '../data/constants.js';

// =====================================================================
//  BOYA / DEĞİŞEN ŞEMASI (Görünüm katmanı) — sade, düz-ikon üstten görünüm
// =====================================================================
// sahibinden.com tarzı referans görseldeki gibi: üstte ön tampon kapağı +
// kaputu, hemen altında ön çamurluk/ayna köşe parçaları, ortada nötr
// (boyanamayan) tavan/cam şeridi, iki yanda kapılar, altta bagaj kapağı +
// arka tampon kapağı, dört köşede tekerlekler. Geometri sade, köşeler
// hafif yuvarlatılmış, gölge/gradyan yok.
var SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

function statusColor(status){ return (PART_STATUS[status] || PART_STATUS.orijinal).color; }

function panel(tag, attrs, part){
  var sd = PART_STATUS[part.status];
  var shape = el(tag, Object.assign({
    fill: sd.color,
    opacity: part.status==='orijinal' ? '0.55' : '0.95',
    stroke: '#26313d', 'stroke-width': '1.4', 'stroke-linejoin':'round'
  }, attrs));
  var title = document.createElementNS(SVG_NS, 'title');
  title.textContent = part.label + ' — ' + sd.label;
  shape.appendChild(title);
  return shape;
}

// ---- geometri sabitleri (viewBox 0 0 200 300, ön üstte) ----
var BL = 34, BR = 166;              // gövde dış sınırı
var RL = 62, RR = 138;              // tavan/cam iç sınırı

var FB_TOP = 4, FB_BOT = 26;        // ön tampon kapağı
var FENDER_TOP = 26, FENDER_BOT = 66;   // ön çamurluk/ayna köşe parçaları
var HOOD_TOP = 30, HOOD_BOT = 80;   // kaput (trapez, aşağı doğru daralır)
var WSF_TOP = 80, WSF_BOT = 98;     // ön cam

var ROOF_TOP = 98, ROOF_BOT = 202;  // tavan/kabin şeridi (nötr, boyanamaz)

var DOOR_F_TOP = 108, DOOR_F_BOT = 150; // ön kapılar
var DOOR_R_TOP = 150, DOOR_R_BOT = 192; // arka kapılar

var WSR_TOP = 202, WSR_BOT = 220;   // arka cam
var TRUNK_TOP = 220, TRUNK_BOT = 270;   // bagaj (trapez, yukarı doğru daralır)
var FENDER_R_TOP = 234, FENDER_R_BOT = 274; // arka çamurluk köşe parçaları (dekoratif)
var RB_TOP = 274, RB_BOT = 296;     // arka tampon kapağı

var WHEEL_F_Y = 129, WHEEL_R_Y = 254, WHEEL_R = 15;

function hoodPath(){
  // yukarıda geniş (tampona bitişik), aşağıda dar (ön cama bitişik) trapez
  return 'M ' + (BL+8) + ' ' + HOOD_TOP + ' L ' + (BR-8) + ' ' + HOOD_TOP +
    ' L ' + (RR-4) + ' ' + HOOD_BOT + ' L ' + (RL+4) + ' ' + HOOD_BOT + ' Z';
}
function trunkPath(){
  // yukarıda dar (arka cama bitişik), aşağıda geniş (tampona bitişik) trapez
  return 'M ' + (RL+4) + ' ' + TRUNK_TOP + ' L ' + (RR-4) + ' ' + TRUNK_TOP +
    ' L ' + (BR-8) + ' ' + TRUNK_BOT + ' L ' + (BL+8) + ' ' + TRUNK_BOT + ' Z';
}
function frontFenderPath(side){
  // kaputun hemen yanında, üst köşeye doğru açılı küçük dörtgen (çamurluk/ayna alanı)
  if(side==='sol'){
    return 'M ' + BL + ' ' + (FENDER_TOP+6) + ' L ' + (RL-2) + ' ' + FENDER_TOP +
      ' L ' + (RL-2) + ' ' + FENDER_BOT + ' L ' + (BL+4) + ' ' + (FENDER_BOT-4) + ' Z';
  }
  return 'M ' + BR + ' ' + (FENDER_TOP+6) + ' L ' + (RR+2) + ' ' + FENDER_TOP +
    ' L ' + (RR+2) + ' ' + FENDER_BOT + ' L ' + (BR-4) + ' ' + (FENDER_BOT-4) + ' Z';
}
function rearFenderPath(side){
  if(side==='sol'){
    return 'M ' + BL + ' ' + (FENDER_R_BOT-6) + ' L ' + (RL-2) + ' ' + FENDER_R_BOT +
      ' L ' + (RL-2) + ' ' + FENDER_R_TOP + ' L ' + (BL+4) + ' ' + (FENDER_R_TOP+4) + ' Z';
  }
  return 'M ' + BR + ' ' + (FENDER_R_BOT-6) + ' L ' + (RR+2) + ' ' + FENDER_R_BOT +
    ' L ' + (RR+2) + ' ' + FENDER_R_TOP + ' L ' + (BR-4) + ' ' + (FENDER_R_TOP+4) + ' Z';
}

export function buildCarPartsDiagram(car){
  var wrap = document.createElement('div');
  wrap.className = 'parts-diagram-wrap';

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 300');
  svg.setAttribute('class', 'parts-diagram-svg');

  function status(key){ return car.partStatus ? (car.partStatus[key] || 'orijinal') : 'orijinal'; }
  function def(key){ return CAR_PART_DEFS.find(function(p){ return p.key===key; }) || {label:key}; }
  function part(key){ return { key:key, label:def(key).label, status:status(key) }; }

  // ---- taban silüeti (açık gri/beyaz gövde) ----
  var body = el('rect', {
    x:BL, y:FB_TOP, width:(BR-BL), height:(RB_BOT-FB_TOP), rx:16,
    fill:'#f2f4f6', stroke:'#c7cfd6', 'stroke-width':'1.2'
  });
  svg.appendChild(body);

  // ---- dört tekerlek: gövde kenarından taşan gri daireler ----
  [ [BL, WHEEL_F_Y], [BR, WHEEL_F_Y], [BL, WHEEL_R_Y], [BR, WHEEL_R_Y] ].forEach(function(p){
    svg.appendChild(el('circle', { cx:p[0], cy:p[1], r:WHEEL_R, fill:'#3a4147', stroke:'#20262b', 'stroke-width':'1' }));
    svg.appendChild(el('circle', { cx:p[0], cy:p[1], r:WHEEL_R*0.42, fill:'#6b7378' }));
  });

  // ---- orta nötr tavan/kabin şeridi (boyanamayan sabit alan) ----
  svg.appendChild(el('rect', {
    x:RL, y:ROOF_TOP, width:(RR-RL), height:(ROOF_BOT-ROOF_TOP), rx:10,
    fill:'#eef1f3', stroke:'#c7cfd6', 'stroke-width':'1'
  }));
  // ön / arka cam vurgusu (tavan şeridinin uçlarında hafif ton farkı)
  svg.appendChild(el('path', {
    d: 'M ' + (RL+2) + ' ' + WSF_BOT + ' L ' + (RR-2) + ' ' + WSF_BOT + ' L ' + (RR-6) + ' ' + (WSF_BOT+10) + ' L ' + (RL+6) + ' ' + (WSF_BOT+10) + ' Z',
    fill:'#c9d7de'
  }));
  svg.appendChild(el('path', {
    d: 'M ' + (RL+6) + ' ' + (WSR_TOP-10) + ' L ' + (RR-6) + ' ' + (WSR_TOP-10) + ' L ' + (RR-2) + ' ' + WSR_TOP + ' L ' + (RL+2) + ' ' + WSR_TOP + ' Z',
    fill:'#c9d7de'
  }));

  // ---- ön grup: tampon kapağı, kaput, çamurluk/ayna köşeleri ----
  svg.appendChild(panel('rect', { x:BL+10, y:FB_TOP, width:(BR-BL-20), height:(FB_BOT-FB_TOP), rx:11 }, part('on-tampon')));
  svg.appendChild(panel('path', { d: hoodPath() }, part('kaput')));
  svg.appendChild(panel('path', { d: frontFenderPath('sol') }, part('sol-on-camurluk')));
  svg.appendChild(panel('path', { d: frontFenderPath('sag') }, part('sag-on-camurluk')));

  // ---- kapılar (sol/sağ, ön + arka) ----
  svg.appendChild(panel('rect', { x:BL, y:DOOR_F_TOP, width:(RL-BL), height:(DOOR_F_BOT-DOOR_F_TOP), rx:4 }, part('sol-on-kapi')));
  svg.appendChild(panel('rect', { x:RR, y:DOOR_F_TOP, width:(BR-RR), height:(DOOR_F_BOT-DOOR_F_TOP), rx:4 }, part('sag-on-kapi')));
  svg.appendChild(panel('rect', { x:BL, y:DOOR_R_TOP, width:(RL-BL), height:(DOOR_R_BOT-DOOR_R_TOP), rx:4 }, part('sol-arka-kapi')));
  svg.appendChild(panel('rect', { x:RR, y:DOOR_R_TOP, width:(BR-RR), height:(DOOR_R_BOT-DOOR_R_TOP), rx:4 }, part('sag-arka-kapi')));

  // ---- arka grup: bagaj (trapez), tampon kapağı ----
  svg.appendChild(panel('path', { d: trunkPath() }, part('bagaj')));
  svg.appendChild(panel('rect', { x:BL+10, y:RB_TOP, width:(BR-BL-20), height:(RB_BOT-RB_TOP), rx:11 }, part('arka-tampon')));

  // ---- arka çamurluk köşeleri — CAR_PART_DEFS'te ayrı alan yok, dekoratif
  //      olarak bagaj (trunk) durumunun rengiyle boyanır ----
  var bagajStatus = status('bagaj');
  [ 'sol', 'sag' ].forEach(function(side){
    var shape = el('path', {
      d: rearFenderPath(side), fill: statusColor(bagajStatus),
      opacity: bagajStatus==='orijinal' ? '0.55' : '0.95',
      stroke:'#26313d', 'stroke-width':'1.4', 'stroke-linejoin':'round'
    });
    svg.appendChild(shape);
  });

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
