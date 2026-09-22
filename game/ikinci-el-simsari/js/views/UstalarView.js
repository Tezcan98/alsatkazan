import { fmt, clamp } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { OperationManager } from '../services/OperationManager.js';
import { IMG } from '../data/images.js';
import { CAR_MODELS, USTALAR, PARTS_CATALOG } from '../data/constants.js';

// =====================================================================
//  USTALAR & YEDEK PARÇACI (Görünüm katmanı) — Kontrol Paneli alt sayfası
// =====================================================================
export var UstalarView = {
  render: function(container){
    var state = Game.state, player = Game.player;

    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Kontrol Paneli';
    back.style.marginBottom = '10px';
    back.onclick = function(){ state.tab = 'panel'; Game.render(); };
    container.appendChild(back);

    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.textContent = 'Yedek Parçacı';
    container.appendChild(h2);

    var partsBox = document.createElement('div');
    partsBox.className = 'card';
    partsBox.style.marginBottom = '16px';

    var pHead = document.createElement('div');
    pHead.style.display = 'flex'; pHead.style.gap = '10px'; pHead.style.alignItems = 'center'; pHead.style.marginBottom = '8px';
    var pIcon = document.createElement('img');
    pIcon.className = 'panel-icon-sm';
    pIcon.src = IMG.icon.parts; pIcon.alt = 'Yedek parça';
    pHead.appendChild(pIcon);
    var pdesc = document.createElement('div');
    pdesc.className = 'kicker';
    pdesc.textContent = 'Marka bazlı parça al — kullanınca usta ücretini %40 düşürür ya da yeterli seviyede kendin tamir etmeni sağlar. Fiyatlar her gün değişir.';
    pHead.appendChild(pdesc);
    partsBox.appendChild(pHead);

    var sel = document.createElement('select');
    sel.style.padding = '6px'; sel.style.marginBottom = '8px'; sel.style.width='100%';
    sel.style.border = '1px solid var(--border)'; sel.style.borderRadius='4px';
    CAR_MODELS.forEach(function(m){
      var opt = document.createElement('option');
      opt.value = m.brand; opt.textContent = m.brand;
      sel.appendChild(opt);
    });
    partsBox.appendChild(sel);

    var partsListWrap = document.createElement('div');
    partsBox.appendChild(partsListWrap);

    function renderPartsForBrand(brand){
      partsListWrap.innerHTML = '';
      // Katalogdaki HER parça türü gösterilir; o gün stokta olmayanlar
      // (Market.refreshPartsMarket bazılarını rastgele atlar) "Stokta yok"
      // olarak, alınamaz şekilde listelenir.
      PARTS_CATALOG.forEach(function(cat){
        var p = state.partsMarket.find(function(x){return x.brand===brand && x.tag===cat.tag;});
        var pr = document.createElement('div');
        pr.className = 'repair-fault-row';
        var lbl = document.createElement('div');
        lbl.className = 'flabel';
        var have = state.parts[brand+'|'+cat.tag] || 0;
        lbl.textContent = cat.name + (have>0 ? ' (elinde ' + have + ')' : '');
        pr.appendChild(lbl);
        if(p){
          var buyBtn = document.createElement('button');
          buyBtn.className = 'btn-ghost btn-sm';
          buyBtn.textContent = fmt(p.price);
          buyBtn.disabled = OperationManager.isBusy() || player.balance < p.price;
          buyBtn.onclick = function(){ Game.doBuyPart(brand, cat.tag); };
          pr.appendChild(buyBtn);
        } else {
          var oos = document.createElement('span');
          oos.className = 'tag-chip';
          oos.style.background = 'var(--ink-faint)';
          oos.style.color = '#fff';
          oos.textContent = 'Bugün stokta yok';
          pr.appendChild(oos);
        }
        partsListWrap.appendChild(pr);
      });
    }
    sel.onchange = function(){ renderPartsForBrand(sel.value); };
    renderPartsForBrand(sel.value);
    container.appendChild(partsBox);

    var h2b = document.createElement('h2');
    h2b.className = 'section';
    h2b.textContent = 'Ustalar';
    container.appendChild(h2b);

    var repairable = state.inventory.filter(function(i){ return i.category==='araba' && i.faults.some(function(f){return !f.fixed;}); });
    if(repairable.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Garajında tamir bekleyen araç yok.';
      container.appendChild(e);
      return;
    }

    var USTA_ICONS = { mahalle: IMG.icon.mechanicMahalle, bilinen: IMG.icon.mechanicBilinen, yetkili: IMG.icon.mechanicYetkili };

    repairable.forEach(function(item){
      var card = document.createElement('div');
      card.className = 'usta-card';
      var h3 = document.createElement('h3');
      h3.textContent = item.title;
      card.appendChild(h3);

      item.faults.forEach(function(f, fi){
        if(f.fixed) return;
        var block = document.createElement('div');
        block.className = 'repair-item';
        var flabel = document.createElement('div');
        flabel.style.fontWeight = '700'; flabel.style.marginBottom='6px'; flabel.style.fontSize='0.86rem';
        flabel.textContent = f.label + (f.heavy ? ' ⚠️ ağır' : '');
        block.appendChild(flabel);

        var partKey = item.brand + '|' + f.tag;
        var hasPart = (state.parts[partKey]||0) > 0;
        var lvl = player.skillLevel('tamir');

        USTALAR.forEach(function(usta){
          var row = document.createElement('div');
          row.className = 'repair-fault-row';
          var icon = document.createElement('img');
          icon.className = 'row-icon';
          icon.src = USTA_ICONS[usta.id]; icon.alt = usta.name;
          row.appendChild(icon);
          var lbl = document.createElement('div');
          lbl.className = 'flabel';
          var cost = Math.round(f.repairCost * usta.priceMult * (hasPart?0.6:1));
          var success = clamp(usta.baseSuccess - (f.heavy?usta.heavyPenalty:0), 0.1, 0.99);
          lbl.innerHTML = '<b>' + usta.name + '</b> — ' + fmt(cost) + ' (%' + Math.round(success*100) + ' başarı)' + (hasPart?' <span class="tag-chip">parça indirimi</span>':'');
          row.appendChild(lbl);
          var btn = document.createElement('button');
          btn.className = 'btn-ghost btn-sm';
          btn.textContent = 'Ver';
          btn.disabled = OperationManager.isBusy() || player.balance < cost;
          btn.onclick = function(){ Game.doRepair(item.id, fi, usta.id); };
          row.appendChild(btn);
          block.appendChild(row);
        });

        if(hasPart && lvl>=3){
          var selfRow = document.createElement('div');
          selfRow.className = 'repair-fault-row';
          var slbl = document.createElement('div');
          slbl.className = 'flabel';
          var ssuccess = clamp(0.35 + lvl*0.06 - (f.heavy?0.25:0), 0.15, 0.95);
          slbl.textContent = 'Kendin Yap — ücretsiz işçilik (%' + Math.round(ssuccess*100) + ' başarı, parça harcanır)';
          selfRow.appendChild(slbl);
          var sbtn = document.createElement('button');
          sbtn.className = 'btn-orange btn-sm';
          sbtn.textContent = 'Kendin Yap';
          sbtn.disabled = OperationManager.isBusy();
          sbtn.onclick = function(){ Game.doSelfRepair(item.id, fi); };
          selfRow.appendChild(sbtn);
          block.appendChild(selfRow);
        } else if(hasPart){
          var hint = document.createElement('div');
          hint.className = 'desc-note';
          hint.style.marginTop='4px';
          hint.textContent = 'Kendin yapabilmek için Tamir Ustalığı en az seviye 3 olmalı (şu an ' + lvl + ').';
          block.appendChild(hint);
        }

        card.appendChild(block);
      });
      container.appendChild(card);
    });
  }
};
