import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { CITIES, CITY_COORDS } from '../data/constants.js';

// =====================================================================
//  HARİTA (Görünüm katmanı) — şehirler arası basit şematik harita
// =====================================================================
// Gerçek coğrafi hassasiyet hedeflenmez: CITY_COORDS üzerindeki basit
// (x,y) konumlarıyla tanınabilir, sade bir düğüm haritası çizilir.
// Oyuncunun bulunduğu şehir vurgulanır, diğer şehirlere tıklanınca
// mesafeye göre ücretli+süreli bir "seyolculuk" (Game.doTravel) başlar.
var SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs){
  var n = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
  return n;
}

// Çok kaba, şematik bir Türkiye silüeti — sadece atmosfer için, coğrafi
// olarak kesin değildir.
var TURKEY_BLOB = 'M18,66 L55,28 L120,14 L210,18 L290,26 L345,44 L378,68 L372,102 L340,134 L280,158 L200,174 L120,176 L58,156 L22,116 Z';

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
    kicker.style.marginBottom = '10px';
    kicker.textContent = 'Şu an: ' + player.currentCity + ' — başka bir şehre gitmek için üzerine tıkla. Yolculuk mesafeye göre para ve zaman alır.';
    container.appendChild(kicker);

    var mapCard = document.createElement('div');
    mapCard.className = 'card';
    mapCard.style.padding = '10px';

    var svg = el('svg', {viewBox:'0 0 400 200', 'class':'map-svg'});
    svg.appendChild(el('path', {d: TURKEY_BLOB, fill:'#eef3ea', stroke:'#cfe0c8', 'stroke-width':'1.5'}));

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
    });

    mapCard.appendChild(svg);
    container.appendChild(mapCard);

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
      lbl.innerHTML = '<b>' + city + '</b>' + (isHere ? ' <span class="tag-chip">buradasın</span>' : '');
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
