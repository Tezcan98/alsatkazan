import { CITIES, CITY_COORDS } from '../data/constants.js';

// =====================================================================
//  HARİTA ÇİZİCİ (paylaşılan) — gerçek Türkiye ana hatlı harita SVG'si
// =====================================================================
// MapView (Harita/Seyahat sekmesi) ile ListingsView'daki (İlanlar) Liste/
// Harita geçişi AYNI çizim mantığını kullanır — SVG üretimi burada tek
// yerde, iki görünüm de kendi tıklama davranışını opts ile geçer.
// CITY_COORDS ve TURKEY_PATH aynı basit enlem/boylam -> (x,y) dönüşümüyle
// üretildi (lon 26-45°D, lat 36-42°K aralığı, x=(lon-26)*16+5,
// y=5+(42-lat)*30), böylece şehirler ana hat içinde gerçekçi göreli
// konumlarında durur.
var SVG_NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

export var TURKEY_PATH = 'M29.0,5.0 L37.0,8.0 L53.0,6.5 L85.0,12.5 L117.0,17.0 L149.0,26.0 L181.0,32.0 ' +
  'L213.0,33.5 L253.0,20.0 L277.0,20.0 L285.0,35.0 L301.0,65.0 L305.8,74.0 L297.8,83.0 L305.8,116.0 ' +
  'L293.0,146.0 L269.0,146.0 L249.8,155.0 L249.8,158.0 L197.0,164.0 L176.2,167.0 L168.2,185.0 ' +
  'L167.4,186.5 L161.8,182.0 L142.6,179.0 L117.0,179.0 L80.2,167.0 L53.0,176.0 L27.4,167.0 L21.0,155.0 ' +
  'L16.2,131.0 L21.0,113.0 L14.6,95.0 L19.4,80.0 L21.0,65.0 L17.8,53.0 L9.8,38.0 L19.4,29.0 Z';
export var VIEWBOX = '0 0 316 195';

// listings dizisinden ({location}) şehir -> ilan listesi haritası üretir.
export function groupByCity(listings){
  var byCity = {};
  listings.forEach(function(l){
    if(!l.location) return;
    (byCity[l.location] = byCity[l.location] || []).push(l);
  });
  return byCity;
}

// container içine Türkiye ana hatlı SVG'yi çizer ve döndürür.
// opts:
//   currentCity      - vurgulanacak (sarı) şehir, genelde player.currentCity
//   listings         - [] rozetler için ({location} alanı olan ürünler)
//   onCityClick(city)   - verilirse, currentCity DIŞINDAKİ şehir noktaları
//                         tıklanabilir olur (ör. seyahat hedefi seçmek için)
//   cityTitleFn(city)   - verilirse, şehir noktasının SVG <title> (tooltip)
//                         metnini özelleştirir
//   onBadgeClick(city, cityListings) - verilirse, ilan-sayısı rozetleri
//                         tıklanabilir olur (ör. o şehrin ilanlarını açmak)
export function renderMap(container, opts){
  opts = opts || {};
  var listings = opts.listings || [];
  var currentCity = opts.currentCity;
  var byCity = groupByCity(listings);

  var svg = el('svg', {viewBox: VIEWBOX, 'class':'map-svg'});
  svg.appendChild(el('path', {d: TURKEY_PATH, fill:'#eef3ea', stroke:'#9db98f', 'stroke-width':'1.5', 'stroke-linejoin':'round'}));

  var here = currentCity ? CITY_COORDS[currentCity] : null;
  if(here){
    CITIES.forEach(function(city){
      if(city===currentCity) return;
      var c = CITY_COORDS[city];
      if(!c) return;
      svg.appendChild(el('line', {
        x1:here.x, y1:here.y, x2:c.x, y2:c.y,
        stroke:'#c7cfd6', 'stroke-width':'1', 'stroke-dasharray':'3,3'
      }));
    });
  }

  CITIES.forEach(function(city){
    var c = CITY_COORDS[city];
    if(!c) return;
    var isHere = city===currentCity;
    var clickable = !isHere && typeof opts.onCityClick === 'function';
    var g = el('g', {'class':'map-city' + (isHere ? ' here' : ''), style:'cursor:' + (clickable ? 'pointer' : 'default')});
    var dot = el('circle', {
      cx:c.x, cy:c.y, r: isHere ? 8 : 5.5,
      fill: isHere ? '#ffd200' : '#243447',
      stroke: isHere ? '#e0ab00' : '#0053a0', 'stroke-width':'1.5'
    });
    g.appendChild(dot);
    var label = el('text', {
      x:c.x, y:c.y - (isHere ? 13 : 10), 'text-anchor':'middle',
      'font-size': isHere ? '11' : '9', 'font-weight': isHere ? '800' : '600',
      fill: isHere ? '#3a2c00' : '#243447'
    });
    label.textContent = city;
    g.appendChild(label);
    if(!isHere){
      var titleText = opts.cityTitleFn ? opts.cityTitleFn(city) : city;
      var title = document.createElementNS(SVG_NS, 'title');
      title.textContent = titleText;
      g.appendChild(title);
      if(clickable){ g.onclick = function(){ opts.onCityClick(city); }; }
    }
    svg.appendChild(g);

    // ---- İlan rozeti: o şehirde ilan varsa küçük kırmızı rozet ----
    var cityListings = byCity[city];
    if(cityListings && cityListings.length>0){
      var bg = el('g', {'class':'map-listing-badge', style:'cursor:' + (opts.onBadgeClick ? 'pointer' : 'default')});
      var badge = el('circle', {cx:c.x+8, cy:c.y-8, r:6.5, fill:'#c62828', stroke:'#fff', 'stroke-width':'1.2'});
      bg.appendChild(badge);
      var count = el('text', {
        x:c.x+8, y:c.y-8+2.8, 'text-anchor':'middle',
        'font-size':'7.5', 'font-weight':'800', fill:'#fff'
      });
      count.textContent = String(cityListings.length);
      bg.appendChild(count);
      var btitle = document.createElementNS(SVG_NS, 'title');
      btitle.textContent = cityListings.length + ' ilan — ' + city + (opts.onBadgeClick ? ' (görmek için tıkla)' : '');
      bg.appendChild(btitle);
      if(opts.onBadgeClick){
        bg.onclick = function(e){ e.stopPropagation(); opts.onBadgeClick(city, cityListings); };
      }
      svg.appendChild(bg);
    }
  });

  container.appendChild(svg);
  return svg;
}
