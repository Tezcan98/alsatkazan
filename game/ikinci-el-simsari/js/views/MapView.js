import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { CITIES, CITY_COORDS } from '../data/constants.js';
import { ListingsView } from './ListingsView.js';

// =====================================================================
//  HARİTA (Görünüm katmanı) — gerçek Türkiye ana hatlı harita
// =====================================================================
// CITY_COORDS ve aşağıdaki TURKEY_PATH aynı basit enlem/boylam ->
// (x,y) dönüşümüyle üretildi (lon 26-45°D, lat 36-42°K aralığı,
// x=(lon-26)*16+5, y=5+(42-lat)*30), böylece şehirler ana hat içinde
// gerçekçi göreli konumlarında durur. Kesin bir coğrafi projeksiyon
// değildir ama Türkiye'nin tanınabilir silüetini (Ege kıyısının
// girintili-çıkıntılı batısı, Karadeniz'in nispeten düz kuzeyi, Hatay
// çıkıntısı, doğudaki dağlık sınır hattı) yansıtır.
var SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

var TURKEY_PATH = 'M29.0,5.0 L37.0,8.0 L53.0,6.5 L85.0,12.5 L117.0,17.0 L149.0,26.0 L181.0,32.0 ' +
  'L213.0,33.5 L253.0,20.0 L277.0,20.0 L285.0,35.0 L301.0,65.0 L305.8,74.0 L297.8,83.0 L305.8,116.0 ' +
  'L293.0,146.0 L269.0,146.0 L249.8,155.0 L249.8,158.0 L197.0,164.0 L176.2,167.0 L168.2,185.0 ' +
  'L167.4,186.5 L161.8,182.0 L142.6,179.0 L117.0,179.0 L80.2,167.0 L53.0,176.0 L27.4,167.0 L21.0,155.0 ' +
  'L16.2,131.0 L21.0,113.0 L14.6,95.0 L19.4,80.0 L21.0,65.0 L17.8,53.0 L9.8,38.0 L19.4,29.0 Z';
var VIEWBOX = '0 0 316 195';

export var MapView = {
  render: function(container){
    var state = Game.state, player = Game.player;
    var busy = OperationManager.isBusy();

    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Kontrol Paneli';
    back.style.marginBottom = '10px';
    back.onclick = function(){ state.tab = 'panel'; Game.render(); };
    container.appendChild(back);

    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.textContent = 'Harita';
    container.appendChild(h2);

    var kicker = document.createElement('div');
    kicker.className = 'desc-note';
    kicker.style.marginBottom = '4px';
    kicker.textContent = 'Şu an: ' + player.currentCity + ' — başka bir şehre gitmek için üzerine tıkla. Kırmızı rozetler o şehirdeki ilan sayısını gösterir, tıklayınca ilanları görürsün.';
    container.appendChild(kicker);

    var travelCar = player.travelCarId ? Game.findInv(player.travelCarId) : null;
    var carLine = document.createElement('div');
    carLine.className = 'desc-note';
    carLine.style.marginBottom = '10px';
    carLine.style.fontStyle = 'normal';
    carLine.innerHTML = travelCar
      ? 'Seyahat aracın: <b>' + travelCar.title + '</b> (' + travelCar.km.toLocaleString('tr-TR') + ' km) — seyahat ettikçe km artar.'
      : 'Seyahat aracın seçili değil — toplu taşımayla gidiyorsun (araç km artmaz). Garaj sekmesinden bir araba seçebilirsin.';
    container.appendChild(carLine);

    var mapCard = document.createElement('div');
    mapCard.className = 'card';
    mapCard.style.padding = '10px';

    var svg = el('svg', {viewBox: VIEWBOX, 'class':'map-svg'});
    svg.appendChild(el('path', {d: TURKEY_PATH, fill:'#eef3ea', stroke:'#9db98f', 'stroke-width':'1.5', 'stroke-linejoin':'round'}));

    // İl bağlantı çizgileri: oyuncunun bulunduğu şehirden diğerlerine
    // ince kesikli çizgiler, mesafeyi görsel olarak hissettirir.
    var here = CITY_COORDS[player.currentCity];
    CITIES.forEach(function(city){
      if(city===player.currentCity) return;
      var c = CITY_COORDS[city];
      if(!here || !c) return;
      svg.appendChild(el('line', {
        x1:here.x, y1:here.y, x2:c.x, y2:c.y,
        stroke:'#c7cfd6', 'stroke-width':'1', 'stroke-dasharray':'3,3'
      }));
    });

    // Şehirdeki aktif ilanlar (araba/arsa/dükkan) — konuma göre gruplanır.
    var listingsByCity = {};
    state.listings.forEach(function(l){
      if(!l.location) return;
      (listingsByCity[l.location] = listingsByCity[l.location] || []).push(l);
    });

    CITIES.forEach(function(city){
      var c = CITY_COORDS[city];
      if(!c) return;
      var isHere = city===player.currentCity;
      var g = el('g', {'class':'map-city' + (isHere ? ' here' : ''), style:'cursor:' + (isHere ? 'default' : 'pointer')});
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
        var dist = Game.cityDistance(player.currentCity, city);
        var desc = TransactionManager.travel(player, player.currentCity, city, dist);
        var title = document.createElementNS(SVG_NS, 'title');
        title.textContent = city + ' — ' + fmt(desc.cost) + ' · ' + TransactionManager.hoursLabel(Math.max(0.3, dist*0.07));
        g.appendChild(title);
        if(!busy){
          g.onclick = function(){ Game.doTravel(city); };
        }
      }
      svg.appendChild(g);

      // ---- İlan rozeti: o şehirde satılık ürün varsa küçük kırmızı rozet ----
      var cityListings = listingsByCity[city];
      if(cityListings && cityListings.length>0){
        var bg = el('g', {'class':'map-listing-badge', style:'cursor:pointer'});
        var badge = el('circle', {cx:c.x+8, cy:c.y-8, r:6.5, fill:'#c62828', stroke:'#fff', 'stroke-width':'1.2'});
        bg.appendChild(badge);
        var count = el('text', {
          x:c.x+8, y:c.y-8+2.8, 'text-anchor':'middle',
          'font-size':'7.5', 'font-weight':'800', fill:'#fff'
        });
        count.textContent = String(cityListings.length);
        bg.appendChild(count);
        var btitle = document.createElementNS(SVG_NS, 'title');
        btitle.textContent = cityListings.length + ' ilan — ' + city + ' (görmek için tıkla)';
        bg.appendChild(btitle);
        bg.onclick = function(e){
          e.stopPropagation();
          if(cityListings.length===1){
            state.openDetailId = cityListings[0].id;
            state.mapSelectedCity = null;
          } else {
            state.mapSelectedCity = (state.mapSelectedCity===city) ? null : city;
          }
          Game.render();
        };
        svg.appendChild(bg);
      }
    });

    mapCard.appendChild(svg);
    container.appendChild(mapCard);

    // ---- Seçili şehrin ilan listesi (haritanın altında, tıklanınca detay açılır) ----
    if(state.mapSelectedCity && listingsByCity[state.mapSelectedCity]){
      var selCard = document.createElement('div');
      selCard.className = 'card';
      selCard.style.marginTop = '10px';
      var selHead = document.createElement('div');
      selHead.style.display = 'flex'; selHead.style.justifyContent = 'space-between'; selHead.style.alignItems = 'center'; selHead.style.marginBottom = '6px';
      var selTitle = document.createElement('div');
      selTitle.className = 'kicker';
      selTitle.textContent = state.mapSelectedCity + ' ilanları (' + listingsByCity[state.mapSelectedCity].length + ')';
      selHead.appendChild(selTitle);
      var closeBtn = document.createElement('button');
      closeBtn.className = 'btn-ghost btn-sm';
      closeBtn.textContent = 'Kapat';
      closeBtn.onclick = function(){ state.mapSelectedCity = null; Game.render(); };
      selHead.appendChild(closeBtn);
      selCard.appendChild(selHead);
      listingsByCity[state.mapSelectedCity].forEach(function(item){
        selCard.appendChild(ListingsView.renderRow(item, {}));
      });
      container.appendChild(selCard);
    }

    var h2b = document.createElement('h2');
    h2b.className = 'section';
    h2b.textContent = 'Şehirler';
    container.appendChild(h2b);

    CITIES.forEach(function(city){
      var isHere = city===player.currentCity;
      var row = document.createElement('div');
      row.className = 'repair-fault-row';
      var lbl = document.createElement('div');
      lbl.className = 'flabel';
      var cnt = listingsByCity[city] ? listingsByCity[city].length : 0;
      lbl.innerHTML = '<b>' + city + '</b>' + (isHere ? ' <span class="tag-chip">buradasın</span>' : '') + (cnt>0 ? ' <span class="tag-chip">' + cnt + ' ilan</span>' : '');
      row.appendChild(lbl);
      if(isHere){
        var goBtn = document.createElement('button');
        goBtn.className = 'btn-ghost btn-sm';
        goBtn.textContent = 'Parçacıyı Gör';
        goBtn.onclick = function(){ state.tab = 'ustalar'; Game.render(); };
        row.appendChild(goBtn);
      } else {
        var dist = Game.cityDistance(player.currentCity, city);
        var desc = TransactionManager.travel(player, player.currentCity, city, dist);
        var btn = document.createElement('button');
        btn.className = 'btn-orange btn-sm';
        btn.textContent = 'Git — ' + fmt(desc.cost);
        btn.disabled = busy || player.balance < desc.cost;
        btn.onclick = function(){ Game.doTravel(city); };
        row.appendChild(btn);
      }
      container.appendChild(row);
    });
  }
};
