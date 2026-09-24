import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { CITIES, CITY_COORDS } from '../data/constants.js';
import { ListingsView } from './ListingsView.js';
import { renderMap, groupByCity } from './MapRenderer.js';

// =====================================================================
//  HARİTA (Görünüm katmanı) — gerçek Türkiye ana hatlı harita + seyahat
// =====================================================================
// SVG çizimi artık MapRenderer'da paylaşılıyor (bkz. o dosya); burada
// sadece seyahat başlatma akışı (hedef şehir seçimi -> Araba/Otobüs modu
// seçimi -> onay) ve ilan rozetleri kalıyor.
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
    kicker.textContent = 'Şu an: ' + player.currentCity + ' — başka bir şehre gitmek için üzerine tıkla, sonra Araba ya da Otobüs seç. Kırmızı rozetler o şehirdeki ilan sayısını gösterir.';
    container.appendChild(kicker);

    var travelCar = player.travelCarId ? Game.findInv(player.travelCarId) : null;
    var carLine = document.createElement('div');
    carLine.className = 'desc-note';
    carLine.style.marginBottom = '10px';
    carLine.style.fontStyle = 'normal';
    carLine.innerHTML = travelCar
      ? 'Seyahat aracın: <b>' + travelCar.title + '</b> (' + travelCar.km.toLocaleString('tr-TR') + ' km) — Araba modunda seyahat ettikçe km artar.'
      : 'Seyahat aracın seçili değil — Araba modu kapalı, sadece Otobüs ile gidebilirsin. Garaj sekmesinden bir araba seçebilirsin.';
    container.appendChild(carLine);

    var mapCard = document.createElement('div');
    mapCard.className = 'card';
    mapCard.style.padding = '10px';

    var byCity = groupByCity(state.listings);

    renderMap(mapCard, {
      currentCity: player.currentCity,
      listings: state.listings,
      cityTitleFn: function(city){
        var dist = Game.cityDistance(player.currentCity, city);
        var busDesc = TransactionManager.travel(player, player.currentCity, city, dist, 'bus');
        return city + ' — otobüs ' + fmt(busDesc.cost) + ' · ' + TransactionManager.hoursLabel(Math.max(0.6, dist*0.13));
      },
      onCityClick: busy ? null : function(city){
        state.travelTargetCity = (state.travelTargetCity===city) ? null : city;
        state.mapSelectedCity = null;
        Game.render();
      },
      onBadgeClick: function(city, cityListings){
        if(cityListings.length===1){
          state.openDetailId = cityListings[0].id;
          state.mapSelectedCity = null;
        } else {
          state.mapSelectedCity = (state.mapSelectedCity===city) ? null : city;
        }
        Game.render();
      }
    });
    container.appendChild(mapCard);

    // ---- Seyahat hedefi seçildiyse: Araba / Otobüs mod seçim paneli ----
    if(state.travelTargetCity && CITY_COORDS[state.travelTargetCity] && state.travelTargetCity !== player.currentCity){
      container.appendChild(this.renderTravelPanel(state.travelTargetCity, busy));
    }

    // ---- Seçili şehrin ilan listesi (haritanın altında, tıklanınca detay açılır) ----
    if(state.mapSelectedCity && byCity[state.mapSelectedCity]){
      var selCard = document.createElement('div');
      selCard.className = 'card';
      selCard.style.marginTop = '10px';
      var selHead = document.createElement('div');
      selHead.style.display = 'flex'; selHead.style.justifyContent = 'space-between'; selHead.style.alignItems = 'center'; selHead.style.marginBottom = '6px';
      var selTitle = document.createElement('div');
      selTitle.className = 'kicker';
      selTitle.textContent = state.mapSelectedCity + ' ilanları (' + byCity[state.mapSelectedCity].length + ')';
      selHead.appendChild(selTitle);
      var closeBtn = document.createElement('button');
      closeBtn.className = 'btn-ghost btn-sm';
      closeBtn.textContent = 'Kapat';
      closeBtn.onclick = function(){ state.mapSelectedCity = null; Game.render(); };
      selHead.appendChild(closeBtn);
      selCard.appendChild(selHead);
      byCity[state.mapSelectedCity].forEach(function(item){
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
      var cnt = byCity[city] ? byCity[city].length : 0;
      lbl.innerHTML = '<b>' + city + '</b>' + (isHere ? ' <span class="tag-chip">buradasın</span>' : '') + (cnt>0 ? ' <span class="tag-chip">' + cnt + ' ilan</span>' : '');
      row.appendChild(lbl);
      if(isHere){
        var goBtn = document.createElement('button');
        goBtn.className = 'btn-ghost btn-sm';
        goBtn.textContent = 'Parçacıyı Gör';
        goBtn.onclick = function(){ state.tab = 'ustalar'; Game.render(); };
        row.appendChild(goBtn);
      } else {
        var selBtn = document.createElement('button');
        selBtn.className = 'btn-orange btn-sm';
        selBtn.textContent = state.travelTargetCity===city ? 'Seçildi ✓' : 'Seç';
        selBtn.disabled = busy;
        selBtn.onclick = function(){ state.travelTargetCity = (state.travelTargetCity===city) ? null : city; state.mapSelectedCity = null; Game.render(); };
        row.appendChild(selBtn);
      }
      container.appendChild(row);
    });
  },

  // Seçili hedef şehir için Araba / Otobüs seçeneklerini gösteren panel.
  renderTravelPanel: function(city, busy){
    var player = Game.player;
    var dist = Game.cityDistance(player.currentCity, city);
    var carDesc = TransactionManager.travel(player, player.currentCity, city, dist, 'car');
    var busDesc = TransactionManager.travel(player, player.currentCity, city, dist, 'bus');
    var hasTravelCar = !!player.travelCarId;

    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '10px';

    var head = document.createElement('div');
    head.style.display = 'flex'; head.style.justifyContent = 'space-between'; head.style.alignItems = 'center'; head.style.marginBottom = '8px';
    var title = document.createElement('div');
    title.className = 'kicker';
    title.textContent = player.currentCity + ' → ' + city + ' — seyahat modunu seç';
    head.appendChild(title);
    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-ghost btn-sm';
    closeBtn.textContent = 'Vazgeç';
    closeBtn.onclick = function(){ Game.state.travelTargetCity = null; Game.render(); };
    head.appendChild(closeBtn);
    card.appendChild(head);

    function optionRow(desc, mode, enabled, disabledReason){
      var row = document.createElement('div');
      row.className = 'repair-fault-row';
      var lbl = document.createElement('div');
      lbl.className = 'flabel';
      lbl.innerHTML = '<b>' + (mode==='car' ? 'Araba' : 'Otobüs') + '</b> — ' + fmt(desc.cost) + ' · ' + desc.durationLabel +
        (enabled ? '' : ' <span class="tag-chip">' + disabledReason + '</span>');
      row.appendChild(lbl);
      var btn = document.createElement('button');
      btn.className = 'btn-orange btn-sm';
      btn.textContent = mode==='car' ? 'Arabayla Git' : 'Otobüsle Git';
      btn.disabled = busy || !enabled || player.balance < desc.cost;
      btn.onclick = function(){ Game.doTravel(city, mode); };
      row.appendChild(btn);
      return row;
    }

    card.appendChild(optionRow(carDesc, 'car', hasTravelCar, 'Önce Garajım\'dan bir seyahat aracı seç'));
    card.appendChild(optionRow(busDesc, 'bus', true, ''));

    return card;
  }
};
