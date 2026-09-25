import { CITIES, CITY_COORDS } from '../data/constants.js';

var SVG_NS = 'http://www.w3.org/2000/svg';
var REAL_MAP_URL = 'https://raw.githubusercontent.com/dnomak/svg-turkiye-haritasi/master/index.html';
var realMapPromise = null;

export function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

// Yedek çizim: uzak SVG kaynağına erişilemezse oyun yine çalışır.
export var TURKEY_PATH = 'M29,5 L37,8 L53,6.5 L85,12.5 L117,17 L149,26 L181,32 L213,33.5 L253,20 L277,20 L285,35 L301,65 L306,74 L298,83 L306,116 L293,146 L270,146 L250,158 L197,164 L176,167 L168,186 L143,179 L117,179 L80,167 L53,176 L27,167 L21,155 L16,131 L21,113 L15,95 L19,80 L21,65 L18,53 L10,38 L19,29 Z';
export var VIEWBOX = '0 0 316 195';

export function groupByCity(listings){
  var byCity = {};
  listings.forEach(function(l){
    if(!l.location) return;
    (byCity[l.location] = byCity[l.location] || []).push(l);
  });
  return byCity;
}

function loadRealMap(){
  if(realMapPromise) return realMapPromise;
  realMapPromise = fetch(REAL_MAP_URL)
    .then(function(r){ if(!r.ok) throw new Error('Turkey SVG alınamadı'); return r.text(); })
    .then(function(html){
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var svg = doc.querySelector('#svg-turkiye-haritasi');
      if(!svg) throw new Error('Turkey SVG bulunamadı');
      return svg;
    })
    .catch(function(){ return null; });
  return realMapPromise;
}

function cityId(city){
  var ids = {
    'İstanbul':'istanbul','Ankara':'ankara','İzmir':'izmir','Bursa':'bursa',
    'Kocaeli':'kocaeli','Antalya':'antalya','Gaziantep':'gaziantep',
    'Konya':'konya','Eskişehir':'eskisehir','Mersin':'mersin'
  };
  return ids[city];
}

function centerOf(group){
  var b = group.getBBox();
  return {x:b.x+b.width/2, y:b.y+b.height/2};
}

function styleProvinceMap(svg){
  svg.setAttribute('class','map-svg map-svg-real');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.querySelectorAll('#turkiye > g').forEach(function(g){
    g.style.cursor = 'default';
    g.querySelectorAll('path').forEach(function(p){
      p.setAttribute('fill','#eef3ea');
      p.setAttribute('stroke','#a8b6a3');
      p.setAttribute('stroke-width','1');
      p.style.transition='fill .15s,stroke .15s';
    });
  });
}

function drawMarkers(svg, opts){
  var listings = opts.listings || [];
  var currentCity = opts.currentCity;
  var byCity = groupByCity(listings);
  var points = {};

  CITIES.forEach(function(city){
    var id=cityId(city), group=id ? svg.querySelector('#'+id) : null;
    if(!group) return;
    points[city]=centerOf(group);
  });

  var layer=el('g', {'class':'map-overlay-layer'});
  var here=points[currentCity];

  // Mevcut şehirden oyun içinde kullanılan şehirlere rota çizgileri.
  if(here){
    CITIES.forEach(function(city){
      if(city===currentCity || !points[city]) return;
      layer.appendChild(el('line',{
        x1:here.x,y1:here.y,x2:points[city].x,y2:points[city].y,
        stroke:'#9aa6b2','stroke-width':'2','stroke-dasharray':'7 7','opacity':'.7'
      }));
    });
  }

  CITIES.forEach(function(city){
    var p=points[city];
    if(!p) return;
    var isHere=city===currentCity;
    var clickable=!isHere && typeof opts.onCityClick==='function';
    var g=el('g',{'class':'map-city-real','style':'cursor:'+(clickable?'pointer':'default')});
    var dot=el('circle',{
      cx:p.x,cy:p.y,r:isHere?10:7,
      fill:isHere?'#ffd200':'#243447',
      stroke:isHere?'#c99700':'#ffffff','stroke-width':'3'
    });
    g.appendChild(dot);
    var label=el('text',{
      x:p.x,y:p.y-(isHere?15:12),'text-anchor':'middle',
      'font-size':isHere?'15':'13','font-weight':isHere?'800':'700',
      fill:'#18232d','paint-order':'stroke','stroke':'#fff','stroke-width':'4','stroke-linejoin':'round'
    });
    label.textContent=city;
    g.appendChild(label);

    var title=document.createElementNS(SVG_NS,'title');
    title.textContent=opts.cityTitleFn ? opts.cityTitleFn(city) : city;
    g.appendChild(title);
    if(clickable){
      g.addEventListener('click',function(){ opts.onCityClick(city); });
    }
    layer.appendChild(g);

    var cityListings=byCity[city];
    if(cityListings && cityListings.length){
      var bg=el('g',{'class':'map-listing-badge','style':'cursor:'+(opts.onBadgeClick?'pointer':'default')});
      bg.appendChild(el('circle',{cx:p.x+13,cy:p.y-13,r:10,fill:'#c62828',stroke:'#fff','stroke-width':'2'}));
      var count=el('text',{x:p.x+13,y:p.y-9,'text-anchor':'middle','font-size':'10','font-weight':'800',fill:'#fff'});
      count.textContent=String(cityListings.length);
      bg.appendChild(count);
      var bt=document.createElementNS(SVG_NS,'title');
      bt.textContent=cityListings.length+' ilan — '+city;
      bg.appendChild(bt);
      if(opts.onBadgeClick) bg.addEventListener('click',function(e){e.stopPropagation();opts.onBadgeClick(city,cityListings);});
      layer.appendChild(bg);
    }
  });

  svg.appendChild(layer);
}

function installRealMap(container, sourceSvg, opts){
  if(!container || !document.body.contains(container)) return;
  var svg=document.importNode(sourceSvg,true);
  styleProvinceMap(svg);
  container.innerHTML='';
  container.appendChild(svg);
  drawMarkers(svg,opts);
}

export function renderMap(container, opts){
  opts=opts||{};
  var fallback=el('svg',{viewBox:VIEWBOX,'class':'map-svg'});
  fallback.appendChild(el('path',{d:TURKEY_PATH,fill:'#eef3ea',stroke:'#9db98f','stroke-width':'1.5','stroke-linejoin':'round'}));
  container.appendChild(fallback);

  // Gerçek 81 il sınırlarını içeren SVG, MIT lisanslı açık kaynak
  // dnomak/svg-turkiye-haritasi kaynağından yüklenir.
  loadRealMap().then(function(svg){
    if(svg) installRealMap(container,svg,opts);
  });

  return fallback;
}
