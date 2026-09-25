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
    var carCount = state.inventory.filter(function(i){return i.category==='araba';}).length;
    var landCount = state.inventory.filter(function(i){return i.category==='arsa';}).length;
    var cap = Game.player.garageCapacity + state.shops.filter(function(s){return s.shopType==='galeri' && s.mode==='kendim';}).reduce(function(n,s){return n+s.capacity;},0);
    var wcap = Game.player.warehouseCapacity + state.shops.filter(function(s){return s.shopType==='emlak' && s.mode==='kendim';}).reduce(function(n,s){return n+s.capacity;},0);
    var capNote=document.createElement('div'); capNote.className='desc-note'; capNote.textContent='Araç kapasitesi: '+carCount+'/'+cap+' · Arsa/depo kapasitesi: '+landCount+'/'+wcap; container.appendChild(capNote);
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
      if(item.forSale) statusParts.push('Satışta (' + item.daysListed + ' gündür, ' + fmt(item.listedPrice) + ')' + (item.boosted ? ' · öne çıkarılmış' : ''));
      if(item.category==='arsa' && item.hasHouse) statusParts.push('Üzerinde ev var.');
      else if(item.category==='arsa' && item.underConstruction) statusParts.push('İnşaat sürüyor (' + item.constructionDaysLeft + ' gün kaldı).');
      if(item.category==='araba') statusParts.push(item.insured ? 'Kaskolu — kaza olursa sadece muafiyet öder.' : 'Kaskosuz — kaza olursa tüm hasar sana ait.');
      status.textContent = statusParts.join(' ');
      card.appendChild(status);
      if(item.category==='araba' && Game.player.travelCarId===item.id){
        var travelBadge = document.createElement('div');
        travelBadge.className = 'badge';
        travelBadge.style.background = 'var(--link)'; travelBadge.style.marginTop = '4px'; travelBadge.style.display = 'inline-block';
        travelBadge.textContent = 'SEYAHAT ARACIN';
        card.appendChild(travelBadge);
      }

      if(item.forSale && item.pendingOffer){
        var offerBox = document.createElement('div');
        offerBox.style.marginTop = '6px'; offerBox.style.padding='7px 9px';
        offerBox.style.background = 'var(--page)'; offerBox.style.borderRadius='5px';
        offerBox.style.fontSize = '0.78rem';
        offerBox.innerHTML = '<b>' + item.pendingOffer.buyerName + '</b> teklif etti: <b>' + fmt(item.pendingOffer.offerPrice) + '</b>';
        card.appendChild(offerBox);
        var offerRow = document.createElement('div');
        offerRow.style.display='flex'; offerRow.style.gap='6px'; offerRow.style.marginTop='6px';
        var accBtn = document.createElement('button');
        accBtn.className = 'btn-orange btn-sm'; accBtn.textContent = 'Teklifi Kabul Et';
        accBtn.disabled = OperationManager.isBusy();
        accBtn.onclick = function(){ Game.resolveBuyerOffer(item.id, true); };
        var rejBtn = document.createElement('button');
        rejBtn.className = 'btn-ghost btn-sm'; rejBtn.textContent = 'Reddet';
        rejBtn.onclick = function(){ Game.resolveBuyerOffer(item.id, false); };
        offerRow.appendChild(accBtn); offerRow.appendChild(rejBtn);
        card.appendChild(offerRow);
      }

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
      if(item.forSale){
        var unlistBtn = document.createElement('button');
        unlistBtn.className = 'btn-ghost btn-sm';
        unlistBtn.textContent = 'Satıştan Kaldır';
        unlistBtn.onclick = function(){ Game.doUnlist(item.id); };
        row.appendChild(unlistBtn);
      } else if(item.category==='arsa' && item.underConstruction){
        // satış devre dışı, inşaat sürüyor
      } else if(!ownerShop){
        var sellBtn = document.createElement('button');
        sellBtn.className = 'btn-navy btn-sm';
        sellBtn.textContent = 'Satışa Çıkar (' + fmt(item.currentValue()) + ')';
        sellBtn.disabled = OperationManager.isBusy();
        sellBtn.onclick = function(){ Game.doListForSale(item.id, item.currentValue()); };
        row.appendChild(sellBtn);
      }
      if(item.category==='arsa' && !item.hasHouse && !item.underConstruction && !item.forSale){
        var buildBtn = document.createElement('button');
        buildBtn.className = 'btn-orange btn-sm';
        buildBtn.textContent = 'Ev İnşa Et';
        buildBtn.disabled = OperationManager.isBusy();
        buildBtn.onclick = function(){ Game.doStartConstruction(item.id); };
        row.appendChild(buildBtn);
      }
      if(item.forSale && !item.boosted){
        var boostBtn = document.createElement('button');
        boostBtn.className = 'btn-orange btn-sm';
        boostBtn.textContent = 'Öne Çıkar';
        boostBtn.disabled = OperationManager.isBusy();
        boostBtn.onclick = function(){ Game.doBoostListing(item.id); };
        row.appendChild(boostBtn);
      }
      if(item.category==='araba'){
        var kaskoBtn = document.createElement('button');
        kaskoBtn.className = item.insured ? 'btn-ghost btn-sm' : 'btn-navy btn-sm';
        kaskoBtn.textContent = item.insured ? 'Kaskoyu İptal Et' : 'Kasko Yaptır';
        kaskoBtn.disabled = OperationManager.isBusy();
        kaskoBtn.onclick = function(){ Game.doToggleKasko(item.id); };
        row.appendChild(kaskoBtn);

        var isTravelCar = Game.player.travelCarId === item.id;
        var travelBtn = document.createElement('button');
        travelBtn.className = isTravelCar ? 'btn-ghost btn-sm' : 'btn-orange btn-sm';
        travelBtn.textContent = isTravelCar ? 'Seyahat Aracımdan Çıkar' : 'Seyahat Aracım Yap';
        travelBtn.onclick = function(){ Game.setTravelCar(item.id); };
        row.appendChild(travelBtn);
      }
      card.appendChild(row);

      grid.appendChild(card);
    });
    container.appendChild(grid);
  }
};
