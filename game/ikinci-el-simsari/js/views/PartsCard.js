import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';
import { IMG } from '../data/images.js';

// =====================================================================
//  YEDEK PARÇA KARTI — İlanlar (Yedek Parça sekmesi) ile Ustalar
//  ekranı arasında paylaşılan tek satır render yardımcısı
// =====================================================================
// state.partsMarket içindeki bir giriş ({city, brand, tag, name, price})
// alır, .listrow tarzı tıklanabilir olmayan bir satır döndürür.
export function buildPartRow(entry){
  var Game_ = Game, player = Game_.player, state = Game_.state;
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
  info.appendChild(h3);
  var meta = document.createElement('div');
  meta.className = 'meta';
  var have = state.parts[entry.brand + '|' + entry.tag] || 0;
  meta.textContent = entry.city + (have > 0 ? ' · elinde ' + have + ' adet' : '');
  info.appendChild(meta);
  row.appendChild(info);

  var right = document.createElement('div');
  right.style.display = 'flex'; right.style.flexDirection = 'column'; right.style.alignItems = 'flex-end'; right.style.gap = '4px';
  var price = document.createElement('div');
  price.className = 'price';
  price.textContent = fmt(entry.price);
  right.appendChild(price);
  var buyBtn = document.createElement('button');
  buyBtn.className = 'btn-orange btn-sm';
  buyBtn.textContent = 'Satın Al';
  buyBtn.disabled = OperationManager.isBusy() || player.balance < entry.price;
  buyBtn.onclick = function(){ Game_.doBuyPart(entry.brand, entry.tag); };
  right.appendChild(buyBtn);
  row.appendChild(right);

  return row;
}
