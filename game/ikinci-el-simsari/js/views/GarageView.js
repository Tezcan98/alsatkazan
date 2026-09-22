import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';

// =====================================================================
//  GARAJIM (Görünüm katmanı)
// =====================================================================
export var GarageView = {
  render: function(container){
    var state = Game.state;
    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.innerHTML = 'Garajım <span class="count">(' + state.inventory.length + ')</span>';
    container.appendChild(h2);

    if(state.inventory.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Garajın boş. İlanlar sekmesinden bir şey satın al.';
      container.appendChild(e);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'grid';
    state.inventory.forEach(function(item){
      var card = document.createElement('div');
      card.className = 'card';

      var thumb = document.createElement('img');
      thumb.className = 'card-thumb';
      thumb.loading = 'lazy';
      thumb.alt = item.title;
      thumb.src = item.thumb();
      thumb.style.filter = item.imgFilter();
      card.appendChild(thumb);

      var kicker = document.createElement('div');
      kicker.className = 'kicker stamp';
      kicker.textContent = 'Alış: ' + fmt(item.purchasePrice);
      card.appendChild(kicker);
      var h3 = document.createElement('h3');
      h3.textContent = item.title;
      card.appendChild(h3);
      var val = document.createElement('div');
      val.className = 'val';
      val.textContent = 'Tahmini değer: ' + fmt(item.currentValue());
      card.appendChild(val);

      var unfixed = item.faults.filter(function(f){return !f.fixed;});
      var status = document.createElement('div');
      status.style.fontSize = '0.78rem';
      status.style.color = 'var(--ink-soft)';
      var statusParts = [];
      if(item.faults.length===0) statusParts.push('Sorunsuz.');
      else if(unfixed.length===0) statusParts.push('Tüm arızalar giderildi.');
      else if(item.category==='araba') statusParts.push(unfixed.length + ' giderilmemiş arıza — Kontrol Paneli → Ustalar.');
      else statusParts.push(unfixed.length + ' bilinen sorun (tamiri yok, sadece değeri düşürür).');
      var ownerShop = item.shopId ? state.shops.find(function(s){return s.id===item.shopId;}) : null;
      if(ownerShop) statusParts.push('Vitrinde: ' + ownerShop.title);
      status.textContent = statusParts.join(' ');
      card.appendChild(status);

      var row = document.createElement('div');
      row.style.display='flex'; row.style.gap='6px'; row.style.marginTop='8px'; row.style.flexWrap='wrap';
      var viewBtn = document.createElement('button');
      viewBtn.className = 'btn-ghost btn-sm';
      viewBtn.textContent = 'İlan Gibi Gör';
      viewBtn.onclick = function(){ state.openDetailId = item.id; Game.render(); };
      row.appendChild(viewBtn);
      if(ownerShop){
        var outBtn = document.createElement('button');
        outBtn.className = 'btn-ghost btn-sm';
        outBtn.textContent = 'Vitrinden Al';
        outBtn.disabled = OperationManager.isBusy();
        outBtn.onclick = function(){ Game.unassignFromShop(ownerShop.id, item.id); };
        row.appendChild(outBtn);
      }
      var sellBtn = document.createElement('button');
      sellBtn.className = 'btn-navy btn-sm';
      sellBtn.textContent = 'Sat';
      sellBtn.disabled = OperationManager.isBusy();
      sellBtn.onclick = function(){ Game.doSell(item.id); };
      row.appendChild(sellBtn);
      card.appendChild(row);

      grid.appendChild(card);
    });
    container.appendChild(grid);
  }
};
