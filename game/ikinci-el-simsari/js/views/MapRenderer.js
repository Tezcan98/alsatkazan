import { CITIES, CITY_COORDS } from '../data/constants.js';

var SVG_NS = 'http://www.w3.org/2000/svg';
var REAL_MAP_URL = './assets/turkey-map.svg';
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
      var doc = new DOMParser().parseFromString(html, 'image/svg+xml');
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
    if(group){
      points[city]=centerOf(group);
    } else if(CITY_COORDS[city]){
      // Gerçek SVG henüz yüklenmediyse bile fallback harita üzerinde
      // oyuncunun konumu ve hedefi hemen görünür.
      points[city]={x:CITY_COORDS[city].x,y:CITY_COORDS[city].y};
    }
  });

  var layer=el('g', {'class':'map-overlay-layer'});
  var here=points[currentCity];

  // Sadece seçilen hedefe rota çizilir; böylece harita "buradan nereye?"
  // sorusunu tek bakışta cevaplar.
  if(here && opts.targetCity && points[opts.targetCity] && opts.targetCity!==currentCity){
    var targetPoint=points[opts.targetCity];
    layer.appendChild(el('line',{
      x1:here.x,y1:here.y,x2:targetPoint.x,y2:targetPoint.y,
      stroke:'#d19a00','stroke-width':'3','stroke-dasharray':'8 6','opacity':'.9'
    }));
  }

  CITIES.forEach(function(city){
    var p=points[city];
    if(!p) return;
    var isHere=city===currentCity;
    var clickable=!isHere && typeof opts.onCityClick==='function';
    var g=el('g',{'class':'map-city-real','style':'cursor:'+(clickable?'pointer':'default')});
    if(isHere){
      // Oyuncunun konumu diğer şehirlerden net biçimde ayrılır:
      // dış halka + merkez nokta + "BURADASIN" etiketi.
      g.appendChild(el('circle',{
        cx:p.x,cy:p.y,r:16,fill:'none',stroke:'#e0a800',
        'stroke-width':'2.5','stroke-dasharray':'3 3','opacity':'.95'
      }));
    }
    var dot=el('circle',{
      cx:p.x,cy:p.y,r:isHere?9:7,
      fill:isHere?'#ffd200':'#243447',
      stroke:isHere?'#8a6500':'#ffffff','stroke-width':isHere?'3.5':'3'
    });
    g.appendChild(dot);

    if(isHere){
      var hereLabel=el('text',{
        x:p.x,y:p.y-24,'text-anchor':'middle',
        'font-size':'9','font-weight':'900',
        fill:'#8a6500','paint-order':'stroke','stroke':'#fff','stroke-width':'3.5','stroke-linejoin':'round'
      });
      hereLabel.textContent='BURADASIN';
      g.appendChild(hereLabel);
    }

    var label=el('text',{
      x:p.x,y:p.y-(isHere?11:12),'text-anchor':'middle',
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
  // Gerçek 81 il SVG'si yüklenene kadar oyuncunun konumu kaybolmasın.
  drawMarkers(fallback,opts);
  container.appendChild(fallback);

  // Gerçek 81 il sınırlarını içeren SVG artık oyunun içinde tutuluyor;
  // harici GitHub/RAW erişimine bağımlı değil.
  loadRealMap().then(function(svg){
    if(svg) installRealMap(container,svg,opts);
  });

  return fallback;
}
