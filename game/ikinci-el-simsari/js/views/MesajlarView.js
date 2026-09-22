import { Game } from '../controllers/GameController.js';

// =====================================================================
//  MESAJLAR (Görünüm katmanı)
// =====================================================================
export var MesajlarView = {
  render: function(container){
    var state = Game.state;
    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.textContent = 'Mesajlar';
    container.appendChild(h2);

    var items = [];
    state.listings.concat(state.inventory).forEach(function(l){
      if(l.category!=='dukkan' && l.messages.length>0) items.push({kind:'ilan', item:l});
    });
    state.shops.forEach(function(s){
      if(s.tenant && s.tenant.pendingRequest) items.push({kind:'kiraci', shop:s});
    });

    if(items.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Hiç mesajın yok.';
      container.appendChild(e);
      return;
    }

    items.forEach(function(entry){
      var row = document.createElement('div');
      row.className = 'listrow';
      var thumb = document.createElement('img');
      thumb.className = 'thumb';
      thumb.loading = 'lazy';
      var thumbSrc = entry.kind==='kiraci' ? entry.shop : entry.item;
      thumb.src = thumbSrc.thumb();
      thumb.style.filter = thumbSrc.imgFilter();
      thumb.alt = '';
      row.appendChild(thumb);
      var info = document.createElement('div');
      info.className = 'info';
      var h3 = document.createElement('h3');
      h3.textContent = entry.kind==='kiraci' ? entry.shop.tenant.name + ' (kiracı)' : entry.item.title;
      if(entry.kind==='ilan' && entry.item.pendingOffer){
        var badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.background = 'var(--orange)'; badge.style.color = '#241a00';
        badge.textContent = 'TEKLİF VAR';
        h3.appendChild(badge);
      }
      info.appendChild(h3);
      var meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = entry.kind==='kiraci' ? entry.shop.tenant.pendingRequest.text : entry.item.messages[entry.item.messages.length-1].text;
      info.appendChild(meta);
      row.appendChild(info);
      row.onclick = function(){
        if(entry.kind==='kiraci'){ state.tab='dukkanlar'; state.openShopId = entry.shop.id; }
        else { state.openDetailId = entry.item.id; }
        Game.render();
      };
      container.appendChild(row);
    });
  }
};
