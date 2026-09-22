import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';

// =====================================================================
//  İLANLAR (Görünüm katmanı)
// =====================================================================
export var ListingsView = {

  renderRow: function(item){
    var row = document.createElement('div');
    row.className = 'listrow';
    row.onclick = function(){ Game.state.openShopId = null; Game.state.openDetailId = item.id; Game.render(); };

    var thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.loading = 'lazy';
    thumb.alt = item.title;
    thumb.src = item.thumb();
    thumb.style.filter = item.imgFilter();
    row.appendChild(thumb);

    var info = document.createElement('div');
    info.className = 'info';
    var h3 = document.createElement('h3');
    h3.textContent = item.title;
    if(item.inspected){
      var b = document.createElement('span');
      b.className = 'badge inspected';
      b.textContent = 'İNCELENDİ';
      h3.appendChild(b);
    }
    info.appendChild(h3);
    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.metaLine ? item.metaLine() : '';
    info.appendChild(meta);
    row.appendChild(info);

    var price = document.createElement('div');
    price.className = 'price';
    price.textContent = fmt(item.askingPrice);
    row.appendChild(price);

    return row;
  },

  render: function(container){
    var state = Game.state;
    var filterbar = document.createElement('div');
    filterbar.className = 'filterbar';
    [['hepsi','Hepsi'],['araba','Araba'],['arsa','Arsa'],['dukkan','Dükkan']].forEach(function(f){
      var b = document.createElement('button');
      b.className = 'btn-ghost' + (state.listingFilter===f[0] ? ' active' : '');
      b.textContent = f[1];
      b.onclick = function(){ state.listingFilter = f[0]; Game.render(); };
      filterbar.appendChild(b);
    });
    container.appendChild(filterbar);

    var h2 = document.createElement('h2');
    h2.className = 'section';
    var filtered = state.listings.filter(function(l){ return state.listingFilter==='hepsi' || l.category===state.listingFilter; });
    h2.innerHTML = 'İlanlar <span class="count">(' + filtered.length + ')</span>';
    container.appendChild(h2);

    if(filtered.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Bu kategoride ilan yok. Kontrol Panelinden sonraki güne geç.';
      container.appendChild(e);
    } else {
      var self = this;
      filtered.forEach(function(item){ container.appendChild(self.renderRow(item)); });
    }
  }
};
