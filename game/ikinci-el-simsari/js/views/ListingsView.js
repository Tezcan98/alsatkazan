import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';

// =====================================================================
//  İLANLAR (Görünüm katmanı)
// =====================================================================
export var ListingsView = {

  renderRow: function(item, opts){
    opts = opts || {};
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
    if(item.inspected && !opts.mine){
      var b = document.createElement('span');
      b.className = 'badge inspected';
      b.textContent = 'İNCELENDİ';
      h3.appendChild(b);
    }
    if(opts.mine){
      var mb = document.createElement('span');
      mb.className = 'badge';
      mb.style.background = 'var(--link)';
      mb.textContent = 'BENİM İLANIM';
      h3.appendChild(mb);
    }
    if(item.pendingOffer){
      var ob = document.createElement('span');
      ob.className = 'badge';
      ob.style.background = 'var(--orange)'; ob.style.color = '#3a2c00';
      ob.textContent = 'TEKLİF VAR';
      h3.appendChild(ob);
    }
    info.appendChild(h3);
    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.metaLine ? item.metaLine() : '';
    info.appendChild(meta);
    row.appendChild(info);

    var right = document.createElement('div');
    right.style.display = 'flex'; right.style.flexDirection = 'column'; right.style.alignItems = 'flex-end'; right.style.gap = '4px';

    var price = document.createElement('div');
    price.className = 'price';
    price.textContent = fmt(opts.mine ? item.listedPrice : item.askingPrice);
    right.appendChild(price);

    if(!opts.mine){
      var favBtn = document.createElement('button');
      favBtn.className = 'fav-btn' + (item.favorite ? ' active' : '');
      favBtn.title = item.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle';
      favBtn.textContent = item.favorite ? '★' : '☆';
      favBtn.onclick = function(e){ e.stopPropagation(); Game.toggleFavorite(item.id); };
      right.appendChild(favBtn);
    }
    row.appendChild(right);

    return row;
  },

  render: function(container){
    var self = this;
    var state = Game.state;

    var filterbar = document.createElement('div');
    filterbar.className = 'filterbar';
    var myListingsCount = state.inventory.filter(function(i){return i.forSale;}).length;
    var favCount = state.listings.filter(function(l){return l.favorite;}).length;
    [
      ['hepsi','Hepsi'], ['araba','Araba'], ['arsa','Arsa'], ['dukkan','Dükkan'],
      ['favoriler','★ Favoriler (' + favCount + ')'],
      ['ilanlarim','İlanlarım (' + myListingsCount + ')']
    ].forEach(function(f){
      var b = document.createElement('button');
      b.className = 'btn-ghost' + (state.listingFilter===f[0] ? ' active' : '');
      b.textContent = f[1];
      b.onclick = function(){ state.listingFilter = f[0]; Game.render(); };
      filterbar.appendChild(b);
    });
    container.appendChild(filterbar);

    var isMine = state.listingFilter === 'ilanlarim';

    // ---- sıralama + fiyat aralığı (yalnızca pazar ilanlarında) ----
    if(!isMine){
      var toolbar = document.createElement('div');
      toolbar.className = 'card';
      toolbar.style.marginBottom = '12px';
      toolbar.style.display = 'flex'; toolbar.style.gap = '8px'; toolbar.style.flexWrap = 'wrap'; toolbar.style.alignItems = 'center';

      var sortLbl = document.createElement('span');
      sortLbl.className = 'kicker'; sortLbl.textContent = 'Sırala:';
      toolbar.appendChild(sortLbl);
      var sortSel = document.createElement('select');
      sortSel.style.padding = '5px'; sortSel.style.border = '1px solid var(--border)'; sortSel.style.borderRadius = '2px';
      [
        ['varsayilan','Varsayılan'], ['fiyat-artan','Fiyat: Artan'], ['fiyat-azalan','Fiyat: Azalan']
      ].forEach(function(o){
        var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
        if(state.listingSort===o[0]) opt.selected = true;
        sortSel.appendChild(opt);
      });
      sortSel.onchange = function(){ state.listingSort = sortSel.value; Game.render(); };
      toolbar.appendChild(sortSel);

      var minInput = document.createElement('input');
      minInput.type = 'number'; minInput.placeholder = 'Min ₺'; minInput.value = state.priceMin;
      minInput.style.width = '90px'; minInput.style.padding = '5px'; minInput.style.border = '1px solid var(--border)'; minInput.style.borderRadius = '2px';
      minInput.onchange = function(){ state.priceMin = minInput.value; Game.render(); };
      toolbar.appendChild(minInput);

      var maxInput = document.createElement('input');
      maxInput.type = 'number'; maxInput.placeholder = 'Max ₺'; maxInput.value = state.priceMax;
      maxInput.style.width = '90px'; maxInput.style.padding = '5px'; maxInput.style.border = '1px solid var(--border)'; maxInput.style.borderRadius = '2px';
      maxInput.onchange = function(){ state.priceMax = maxInput.value; Game.render(); };
      toolbar.appendChild(maxInput);

      container.appendChild(toolbar);
    }

    var h2 = document.createElement('h2');
    h2.className = 'section';

    var filtered, mineList = [];
    if(isMine){
      filtered = state.inventory.filter(function(i){return i.forSale;});
    } else if(state.listingFilter==='favoriler'){
      filtered = state.listings.filter(function(l){return l.favorite;});
    } else {
      filtered = state.listings.filter(function(l){ return state.listingFilter==='hepsi' || l.category===state.listingFilter; });
    }

    if(!isMine){
      var min = parseFloat(state.priceMin), max = parseFloat(state.priceMax);
      if(!isNaN(min)) filtered = filtered.filter(function(l){return l.askingPrice>=min;});
      if(!isNaN(max)) filtered = filtered.filter(function(l){return l.askingPrice<=max;});
      if(state.listingSort==='fiyat-artan') filtered = filtered.slice().sort(function(a,b){return a.askingPrice-b.askingPrice;});
      else if(state.listingSort==='fiyat-azalan') filtered = filtered.slice().sort(function(a,b){return b.askingPrice-a.askingPrice;});
    }

    h2.innerHTML = (isMine ? 'İlanlarım' : 'İlanlar') + ' <span class="count">(' + filtered.length + ')</span>';
    container.appendChild(h2);

    if(filtered.length===0){
      var e = document.createElement('div'); e.className='empty';
      e.textContent = isMine ? 'Satışa çıkardığın bir ürün yok — Garaj sekmesinden bir ürünü satışa çıkarabilirsin.'
        : state.listingFilter==='favoriler' ? 'Henüz favori ilanın yok — bir ilanın yanındaki yıldıza dokun.'
        : 'Bu kategoride ilan yok. Kontrol Panelinden sonraki güne geç.';
      container.appendChild(e);
    } else {
      filtered.forEach(function(item){ container.appendChild(self.renderRow(item, {mine:isMine})); });
    }
  }
};
