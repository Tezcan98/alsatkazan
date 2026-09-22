import { CAR_PART_DEFS, PART_STATUS } from '../data/constants.js';

// =====================================================================
//  BOYA / DEĞİŞEN ŞEMASI (Görünüm katmanı) — sahibinden.com tarzı
// =====================================================================
// Üstten görünüm basit bir araç şeması: her kaporta parçası kendi
// durumuna (orijinal/boyalı/değişen) göre renklendirilir + alt tarafta
// okunabilir bir liste ve renk lejantı gösterilir.
var SVG_NS = 'http://www.w3.org/2000/svg';

function rect(x,y,w,h,rx){
  var r = document.createElementNS(SVG_NS,'rect');
  r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h);
  if(rx) r.setAttribute('rx',rx);
  r.setAttribute('stroke','#26313d'); r.setAttribute('stroke-width','1.2');
  return r;
}

var PART_GEOM = {
  "on-tampon":        [58, 8,  64, 22, 6],
  "kaput":            [54, 32, 72, 34, 4],
  "sol-on-camurluk":  [30, 32, 22, 60, 4],
  "sag-on-camurluk":  [128, 32, 22, 60, 4],
  "sol-on-kapi":      [30, 94, 22, 50, 3],
  "sag-on-kapi":      [128, 94, 22, 50, 3],
  "sol-arka-kapi":    [30, 146, 22, 46, 3],
  "sag-arka-kapi":    [128, 146, 22, 46, 3],
  "tavan":            [54, 94, 72, 98, 6],
  "bagaj":            [54, 194, 72, 30, 4],
  "arka-tampon":      [58, 226, 64, 20, 6]
};

export function buildCarPartsDiagram(car){
  var wrap = document.createElement('div');
  wrap.className = 'parts-diagram-wrap';

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 180 254');
  svg.setAttribute('class', 'parts-diagram-svg');

  // taban gölgesi
  var shadow = rect(24, 30, 132, 196, 14);
  shadow.setAttribute('fill', '#e4e8eb');
  shadow.setAttribute('stroke', 'none');
  svg.appendChild(shadow);

  CAR_PART_DEFS.forEach(function(part){
    var geom = PART_GEOM[part.key];
    if(!geom) return;
    var status = car.partStatus ? (car.partStatus[part.key] || 'orijinal') : 'orijinal';
    var sd = PART_STATUS[status];
    var el = rect(geom[0], geom[1], geom[2], geom[3], geom[4]);
    el.setAttribute('fill', sd.color);
    el.setAttribute('opacity', status==='orijinal' ? '0.55' : '0.92');
    var title = document.createElementNS(SVG_NS, 'title');
    title.textContent = part.label + ' — ' + sd.label;
    el.appendChild(title);
    svg.appendChild(el);
  });

  // ön cam / arka cam ipucu çizgileri
  var line1 = document.createElementNS(SVG_NS,'line');
  line1.setAttribute('x1','54'); line1.setAttribute('y1','94'); line1.setAttribute('x2','126'); line1.setAttribute('y2','94');
  line1.setAttribute('stroke','#ffffff'); line1.setAttribute('stroke-width','2');
  svg.appendChild(line1);
  var line2 = document.createElementNS(SVG_NS,'line');
  line2.setAttribute('x1','54'); line2.setAttribute('y1','188'); line2.setAttribute('x2','126'); line2.setAttribute('y2','188');
  line2.setAttribute('stroke','#ffffff'); line2.setAttribute('stroke-width','2');
  svg.appendChild(line2);

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
