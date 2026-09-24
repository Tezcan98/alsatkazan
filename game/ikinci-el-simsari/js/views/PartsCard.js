import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';
import { IMG } from '../data/images.js';

// =====================================================================
//  YEDEK PARÇA KARTI — İlanlar (Yedek Parça sekmesi) ile Ustalar
//  ekranı arasında paylaşılan tek satır render yardımcısı
// =====================================================================
// state.partsMarket içindeki bir giriş ({city, brand, tag, name, price})
// alır, .listrow tarzı tıklanabilir olmayan bir satır döndürür. Artık
// İlanlar → Yedek Parça sekmesi TÜM şehirleri birden gösterdiği için
// (bkz. ListingsView), entry.city bulunduğun şehir DEĞİLSE satır otomatik
// olarak kargo fiyatını/süresini de gösterir ve "Kargoyla Sipariş Ver"
// düğmesine döner — bkz. Game.doBuyPart / Game.cargoEstimate.
export function buildPartRow(entry){
  var Game_ = Game, player = Game_.player, state = Game_.state;
  var isHere = entry.city === player.currentCity;
  var row = document.createElement('div');
  row.className = 'listrow';

  var thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.loading = 'lazy';
  thumb.alt = entry.name;
  thumb.src = IMG.icon.parts;
  row.appendChild(thumb);

  var info = document.createElement('div');
  info.className = 'info';
  var h3 = document.createElement('h3');
  h3.textContent = entry.brand + ' — ' + entry.name;
  if(!isHere){
    var cb = document.createElement('span');
    cb.className = 'badge';
    cb.style.background = 'var(--navy)';
    cb.textContent = entry.city.toUpperCase();
    h3.appendChild(cb);
  }
  info.appendChild(h3);
  var meta = document.createElement('div');
  meta.className = 'meta';
  var have = state.parts[entry.brand + '|' + entry.tag] || 0;
  var est = !isHere ? Game_.cargoEstimate(entry.city) : null;
  meta.textContent = (isHere ? 'Bu şehirde — elden teslim' : 'Kargo ile ' + est.days + ' gün içinde ulaşır') + (have > 0 ? ' · elinde ' + have + ' adet' : '');
  info.appendChild(meta);
  row.appendChild(info);

  var right = document.createElement('div');
  right.style.display = 'flex'; right.style.flexDirection = 'column'; right.style.alignItems = 'flex-end'; right.style.gap = '4px';
  var price = document.createElement('div');
  price.className = 'price';
  var totalCost = isHere ? entry.price : (entry.price + est.shipping);
  price.textContent = fmt(totalCost);
  right.appendChild(price);
  if(!isHere){
    var shipNote = document.createElement('div');
    shipNote.style.fontSize = '0.68rem'; shipNote.style.color = 'var(--ink-faint)';
    shipNote.textContent = fmt(entry.price) + ' + ' + fmt(est.shipping) + ' kargo';
    right.appendChild(shipNote);
  }
  var buyBtn = document.createElement('button');
  buyBtn.className = 'btn-orange btn-sm';
  buyBtn.textContent = isHere ? 'Satın Al' : 'Kargoyla Sipariş Ver';
  buyBtn.disabled = OperationManager.isBusy() || player.balance < totalCost;
  buyBtn.onclick = function(){ Game_.doBuyPart(entry.brand, entry.tag, entry.city); };
  right.appendChild(buyBtn);
  row.appendChild(right);

  return row;
}
