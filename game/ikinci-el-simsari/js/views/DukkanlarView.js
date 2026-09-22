import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';
import { MASRAF_OPTIONS } from '../data/constants.js';

// =====================================================================
//  DÜKKANLARIM (Görünüm katmanı) — Kontrol Paneli alt sayfası
// =====================================================================
export var DukkanlarView = {
  render: function(container){
    var state = Game.state;
    if(state.openShopId){
      this.renderShopDetail(container, state.openShopId);
      return;
    }

    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Kontrol Paneli';
    back.style.marginBottom = '10px';
    back.onclick = function(){ state.tab = 'panel'; Game.render(); };
    container.appendChild(back);

    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.innerHTML = 'Dükkanlarım <span class="count">(' + state.shops.length + ')</span>';
    container.appendChild(h2);

    if(state.shops.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Henüz dükkanın yok. İlanlar sekmesinde "Dükkan" filtresine bak.';
      container.appendChild(e);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'grid';
    state.shops.forEach(function(shop){
      var card = document.createElement('div');
      card.className = 'card click';
      card.onclick = function(){ state.openShopId = shop.id; Game.render(); };

      var thumb = document.createElement('img');
      thumb.className = 'card-thumb';
      thumb.loading = 'lazy';
      thumb.alt = shop.title;
      thumb.src = shop.thumb();
      thumb.style.filter = shop.imgFilter();
      card.appendChild(thumb);

      var kicker = document.createElement('div');
      kicker.className = 'kicker';
      kicker.textContent = shop.shopType==='galeri' ? 'Oto Galerisi' : 'Emlak Ofisi';
      card.appendChild(kicker);
      var h3 = document.createElement('h3');
      h3.textContent = shop.title;
      card.appendChild(h3);
      var val = document.createElement('div');
      val.className = 'val';
      val.textContent = shop.mode==='kiraci' && shop.tenant ? 'Kiracı: ' + shop.tenant.name : 'Vitrin: ' + shop.slots.length + '/' + shop.capacity;
      card.appendChild(val);
      var meta = document.createElement('div');
      meta.style.fontSize='0.78rem'; meta.style.color='var(--ink-soft)';
      meta.textContent = 'Aylık kira: ' + fmt(Math.round(shop.rent*shop.rentMult));
      card.appendChild(meta);
      grid.appendChild(card);
    });
    container.appendChild(grid);
  },

  renderShopDetail: function(container, shopId){
    var state = Game.state;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    if(!shop){ state.openShopId = null; return; }
    var busy = OperationManager.isBusy();

    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Dükkanlarım';
    back.style.marginBottom = '10px';
    back.onclick = function(){ state.openShopId = null; Game.render(); };
    container.appendChild(back);

    var hero = document.createElement('img');
    hero.className = 'hero';
    hero.loading = 'lazy';
    hero.alt = shop.title;
    hero.src = shop.hero();
    hero.style.filter = shop.imgFilter();
    container.appendChild(hero);

    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.textContent = shop.title;
    container.appendChild(h2);

    var infoCard = document.createElement('div');
    infoCard.className = 'card';
    infoCard.style.marginBottom = '14px';
    infoCard.innerHTML =
      '<div class="kicker">' + (shop.shopType==='galeri' ? 'Oto Galerisi — araba kabul eder' : 'Emlak Ofisi — arsa kabul eder') + '</div>' +
      '<div style="margin-top:6px;font-size:0.85rem;">Aylık kira: <b>' + fmt(Math.round(shop.rent*shop.rentMult)) + '</b></div>' +
      '<div style="font-size:0.85rem;">Vitrin kapasitesi: <b>' + shop.capacity + '</b></div>';
    container.appendChild(infoCard);

    // ---- Masraflar ----
    var h3m = document.createElement('h2');
    h3m.className = 'section';
    h3m.style.fontSize = '0.84rem';
    h3m.textContent = 'Masraflar';
    container.appendChild(h3m);
    MASRAF_OPTIONS.forEach(function(opt){
      var row = document.createElement('div');
      row.className = 'repair-fault-row';
      var done = shop.upgrades.indexOf(opt.id) >= 0;
      var lbl = document.createElement('div');
      lbl.className = 'flabel';
      lbl.innerHTML = '<b>' + opt.name + '</b><br><span style="color:var(--ink-soft);font-size:0.78rem;">' + opt.desc + '</span>';
      row.appendChild(lbl);
      var btn = document.createElement('button');
      btn.className = 'btn-ghost btn-sm';
      btn.textContent = done ? 'Yapıldı ✓' : fmt(opt.cost);
      btn.disabled = done || busy || Game.player.balance < opt.cost;
      btn.onclick = function(){ Game.doShopUpgrade(shop.id, opt.id); };
      row.appendChild(btn);
      container.appendChild(row);
    });

    // ---- Kiracı ----
    var h3t = document.createElement('h2');
    h3t.className = 'section';
    h3t.style.fontSize = '0.84rem';
    h3t.textContent = 'Kiracı İlişkileri';
    container.appendChild(h3t);

    if(shop.mode==='kiraci' && shop.tenant){
      var t = shop.tenant;
      var tCard = document.createElement('div');
      tCard.className = 'card';
      tCard.innerHTML =
        '<h3>' + t.name + '</h3>' +
        '<div class="kicker">' + t.business + '</div>' +
        '<div style="margin-top:6px;font-size:0.85rem;">Aylık kira: <b>' + fmt(t.rent) + '</b></div>' +
        '<div style="font-size:0.85rem;">Memnuniyet: <b>%' + t.satisfaction + '</b></div>';
      container.appendChild(tCard);

      if(t.pendingRequest){
        var reqCard = document.createElement('div');
        reqCard.className = 'card';
        reqCard.style.marginTop = '8px';
        reqCard.innerHTML = '<b>Kiracı talebi:</b><div style="margin:6px 0;font-size:0.85rem;">' + t.pendingRequest.text + '</div>';
        var reqRow = document.createElement('div');
        reqRow.style.display='flex'; reqRow.style.gap='6px';
        var accBtn = document.createElement('button');
        accBtn.className = 'btn-orange btn-sm'; accBtn.textContent = 'Kabul Et';
        accBtn.onclick = function(){ Game.resolveTenantRequest(shop.id, true); };
        var rejBtn = document.createElement('button');
        rejBtn.className = 'btn-ghost btn-sm'; rejBtn.textContent = 'Reddet';
        rejBtn.onclick = function(){ Game.resolveTenantRequest(shop.id, false); };
        reqRow.appendChild(accBtn); reqRow.appendChild(rejBtn);
        reqCard.appendChild(reqRow);
        container.appendChild(reqCard);
      }

      var evictBtn = document.createElement('button');
      evictBtn.className = 'btn-red btn-sm';
      evictBtn.style.marginTop = '10px';
      evictBtn.textContent = 'Tahliye Et';
      evictBtn.disabled = busy;
      evictBtn.onclick = function(){ Game.doEvictTenant(shop.id); };
      container.appendChild(evictBtn);
    } else {
      if(shop.tenantCandidate){
        var candCard = document.createElement('div');
        candCard.className = 'card';
        candCard.innerHTML =
          '<h3>' + shop.tenantCandidate.name + '</h3>' +
          '<div class="kicker">' + shop.tenantCandidate.business + '</div>' +
          '<div style="margin-top:6px;font-size:0.85rem;">Teklif edilen kira: <b>' + fmt(shop.tenantCandidate.offeredRent) + '</b></div>';
        var cRow = document.createElement('div');
        cRow.style.display='flex'; cRow.style.gap='6px'; cRow.style.marginTop='8px';
        var accBtn2 = document.createElement('button');
        accBtn2.className = 'btn-orange btn-sm'; accBtn2.textContent = 'Kabul Et';
        accBtn2.disabled = busy;
        accBtn2.onclick = function(){ Game.doAcceptTenant(shop.id); };
        var rejBtn2 = document.createElement('button');
        rejBtn2.className = 'btn-ghost btn-sm'; rejBtn2.textContent = 'Reddet';
        rejBtn2.onclick = function(){ Game.rejectTenantCandidate(shop.id); };
        cRow.appendChild(accBtn2); cRow.appendChild(rejBtn2);
        candCard.appendChild(cRow);
        container.appendChild(candCard);
      } else {
        var findBtn = document.createElement('button');
        findBtn.className = 'btn-ghost btn-sm';
        findBtn.textContent = 'Kiracı Ara';
        findBtn.onclick = function(){ Game.findTenantCandidate(shop.id); };
        container.appendChild(findBtn);
      }

      // ---- Vitrin (kendin işletirken) ----
      var h3v = document.createElement('h2');
      h3v.className = 'section';
      h3v.style.fontSize = '0.84rem';
      h3v.textContent = 'Vitrin (' + shop.slots.length + '/' + shop.capacity + ')';
      container.appendChild(h3v);

      if(shop.slots.length===0){
        var ev = document.createElement('div'); ev.className='empty'; ev.textContent='Vitrin boş.';
        container.appendChild(ev);
      } else {
        shop.slots.forEach(function(itemId){
          var item = Game.findInv(itemId);
          if(!item) return;
          var row = document.createElement('div');
          row.className = 'repair-fault-row';
          var lbl = document.createElement('div');
          lbl.className = 'flabel';
          lbl.textContent = item.title + ' — ' + fmt(item.currentValue());
          row.appendChild(lbl);
          var btns = document.createElement('div');
          btns.className = 'usta-btns';
          var sellNow = document.createElement('button');
          sellNow.className = 'btn-orange btn-sm';
          sellNow.textContent = 'Şimdi Sat';
          sellNow.disabled = busy;
          sellNow.onclick = function(){ Game.doSellFromShop(shop.id, item.id); };
          var take = document.createElement('button');
          take.className = 'btn-ghost btn-sm';
          take.textContent = 'Geri Al';
          take.onclick = function(){ Game.unassignFromShop(shop.id, item.id); };
          btns.appendChild(sellNow); btns.appendChild(take);
          row.appendChild(btns);
          container.appendChild(row);
        });
      }

      var candidates = state.inventory.filter(function(i){ return i.category===shop.accepts && !i.shopId && !i.underConstruction; });
      if(candidates.length>0 && shop.slots.length < shop.capacity){
        var addSel = document.createElement('div');
        addSel.style.marginTop = '10px';
        var sel = document.createElement('select');
        sel.style.padding='6px'; sel.style.border='1px solid var(--border)'; sel.style.borderRadius='4px'; sel.style.marginRight='6px';
        candidates.forEach(function(c){
          var opt = document.createElement('option');
          opt.value = c.id; opt.textContent = c.title;
          sel.appendChild(opt);
        });
        var addBtn = document.createElement('button');
        addBtn.className = 'btn-ghost btn-sm';
        addBtn.textContent = 'Vitrine Koy';
        addBtn.onclick = function(){ Game.assignToShop(shop.id, Number(sel.value)); };
        addSel.appendChild(sel); addSel.appendChild(addBtn);
        container.appendChild(addSel);
      }
    }
  }
};
