import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { CAR_QUESTIONS, ARSA_QUESTIONS } from '../data/constants.js';
import { buildCarPartsDiagram } from './CarPartsDiagram.js';

// =====================================================================
//  İLAN DETAYI (Görünüm katmanı) — sağdan kayan overlay
// =====================================================================
export var DetailView = {
  render: function(){
    var state = Game.state, player = Game.player;
    var item = Game.findAny(state.openDetailId);
    if(!item) return null;
    var busy = OperationManager.isBusy();

    var overlay = document.createElement('div');
    overlay.className = 'overlay';

    var oh = document.createElement('div');
    oh.className = 'overlay-header';
    var back = document.createElement('button');
    back.textContent = '← Geri';
    back.onclick = function(){ state.openDetailId = null; Game.render(); };
    oh.appendChild(back);
    var t = document.createElement('div');
    t.style.fontWeight = '700';
    t.style.flex = '1 1 auto';
    t.textContent = item.category==='araba' ? 'Araba İlanı' : item.category==='dukkan' ? 'Dükkan İlanı' : 'Arsa İlanı';
    oh.appendChild(t);
    if(!item.owned){
      var favBtn = document.createElement('button');
      favBtn.textContent = item.favorite ? '★ Favoride' : '☆ Favorile';
      favBtn.onclick = function(){ Game.toggleFavorite(item.id); };
      oh.appendChild(favBtn);
    }
    overlay.appendChild(oh);

    var body = document.createElement('div');
    body.className = 'overlay-body';

    var hero = document.createElement('img');
    hero.className = 'hero';
    hero.loading = 'lazy';
    hero.alt = item.title;
    hero.src = item.hero();
    hero.style.filter = item.imgFilter();
    body.appendChild(hero);

    var h1 = document.createElement('div');
    h1.className = 'detail-title';
    h1.textContent = item.title;
    body.appendChild(h1);

    if(item.isDeal && !item.owned && item.originalPrice){
      var dealBanner = document.createElement('div');
      dealBanner.className = 'badge';
      dealBanner.style.background = 'var(--red)'; dealBanner.style.marginBottom = '4px'; dealBanner.style.display = 'inline-block';
      dealBanner.textContent = 'FIRSAT İLANI';
      body.appendChild(dealBanner);
    }
    var pr = document.createElement('div');
    pr.className = 'detail-price';
    if(item.isDeal && !item.owned && item.originalPrice){
      var oldP = document.createElement('span');
      oldP.style.fontSize = '0.6em'; oldP.style.color = 'var(--ink-faint)'; oldP.style.textDecoration = 'line-through'; oldP.style.marginRight = '8px';
      oldP.textContent = fmt(item.originalPrice);
      pr.appendChild(oldP);
    }
    var prVal = document.createElement('span');
    prVal.textContent = fmt(item.askingPrice);
    pr.appendChild(prVal);
    body.appendChild(pr);

    var table = document.createElement('table');
    table.className = 'spec-table';
    item.specRows().forEach(function(r){
      var tr = document.createElement('tr');
      var td1 = document.createElement('td'); td1.textContent = r[0];
      var td2 = document.createElement('td'); td2.textContent = r[1];
      tr.appendChild(td1); tr.appendChild(td2);
      table.appendChild(tr);
    });
    body.appendChild(table);

    if(item.category==='araba'){
      var diagTitle = document.createElement('h2');
      diagTitle.className = 'section';
      diagTitle.textContent = 'Boya / Değişen Bilgisi';
      body.appendChild(diagTitle);
      body.appendChild(buildCarPartsDiagram(item));
    }

    var descBox = document.createElement('div');
    descBox.className = 'desc-box';
    descBox.textContent = item.description;
    body.appendChild(descBox);
    var descNote = document.createElement('div');
    descNote.className = 'desc-note';
    descNote.textContent = 'İlan sahibinin beyanıdır, doğruluğu garanti edilmez.';
    body.appendChild(descNote);

    if(item.inspected){
      // Sahip değilsen ekspertizin kaçırdığı (hidden) arızalar gösterilmez —
      // bunlar satın aldıktan sonra "kazık" olarak ortaya çıkabilir.
      var visibleFaults = item.owned ? item.faults : item.faults.filter(function(f){return !f.hidden;});
      if(visibleFaults.length===0){
        var ok = document.createElement('div');
        ok.className = 'desc-note';
        ok.style.fontStyle='normal';
        ok.textContent = 'Ekspertiz sonucu: bilinen sorun yok.';
        body.appendChild(ok);
      } else {
        var ul = document.createElement('ul');
        ul.className = 'fault-list';
        visibleFaults.forEach(function(f){
          var li = document.createElement('li');
          li.className = f.fixed ? 'fixed' : '';
          li.textContent = f.label + (item.category==='araba' ? (f.fixed ? ' — tamir edildi' : ' (tamiri ~' + fmt(f.repairCost) + ')') : ' (değer kaybı ~' + fmt(f.loss) + ')');
          ul.appendChild(li);
        });
        body.appendChild(ul);
      }
      if(!item.owned && item.inspectionQuality==='normal'){
        var qnote = document.createElement('div');
        qnote.className = 'desc-note';
        qnote.textContent = 'Standart ekspertiz — bir şeyler gözden kaçmış olabilir. Garantili sonuç için TRAMER Tam Rapor iste.';
        body.appendChild(qnote);
      }
    }

    var actions = document.createElement('div');
    actions.className = 'action-row';
    if(!item.owned){
      if(item.category!=='dukkan' && !item.inspected){
        var insDesc = TransactionManager.inspection(player, item);
        var insBtn = document.createElement('button');
        insBtn.className = 'btn-ghost';
        insBtn.textContent = 'Ekspertiz Yaptır (' + fmt(insDesc.cost) + ')';
        insBtn.disabled = busy;
        insBtn.onclick = function(){ Game.doInspect(item.id, false); };
        actions.appendChild(insBtn);

        var fullDesc = TransactionManager.fullInspection(player, item);
        var fullBtn = document.createElement('button');
        fullBtn.className = 'btn-ghost';
        fullBtn.textContent = 'TRAMER Tam Rapor (' + fmt(fullDesc.cost) + ')';
        fullBtn.disabled = busy;
        fullBtn.onclick = function(){ Game.doInspect(item.id, true); };
        actions.appendChild(fullBtn);
      }
      var buyBtn = document.createElement('button');
      buyBtn.className = 'btn-orange';
      buyBtn.textContent = item.category==='dukkan' ? 'Devren Satın Al' : 'Satın Al';
      buyBtn.disabled = busy || player.balance < item.askingPrice;
      buyBtn.onclick = function(){ Game.doBuy(item.id); };
      actions.appendChild(buyBtn);
    } else if(item.forSale){
      var unlistBtn = document.createElement('button');
      unlistBtn.className = 'btn-ghost';
      unlistBtn.textContent = 'Satıştan Kaldır';
      unlistBtn.onclick = function(){ Game.doUnlist(item.id); };
      actions.appendChild(unlistBtn);
      if(!item.boosted){
        var boostDesc = TransactionManager.boostListing(player, item);
        var boostBtn = document.createElement('button');
        boostBtn.className = 'btn-orange';
        boostBtn.textContent = 'İlanı Öne Çıkar (' + fmt(boostDesc.cost) + ')';
        boostBtn.disabled = busy || player.balance < boostDesc.cost;
        boostBtn.onclick = function(){ Game.doBoostListing(item.id); };
        actions.appendChild(boostBtn);
      }
      var note = document.createElement('div');
      note.className = 'desc-note';
      note.style.width = '100%';
      note.textContent = 'İlanda: ' + fmt(item.listedPrice) + ' — ' + item.daysListed + ' gündür satışta, alıcı bekleniyor.' +
        (item.boosted ? ' Öne çıkarılmış (' + item.boostDaysLeft + ' gün kaldı).' : '');
      actions.appendChild(note);
    } else if(item.underConstruction){
      var constrNote = document.createElement('div');
      constrNote.className = 'desc-note';
      constrNote.style.width = '100%';
      constrNote.textContent = 'İnşaat sürüyor — ' + item.constructionDaysLeft + ' gün kaldı. İnşaat bitene kadar satışa çıkarılamaz.';
      actions.appendChild(constrNote);
    } else {
      var sellBtn = document.createElement('button');
      sellBtn.className = 'btn-navy';
      sellBtn.textContent = 'Satışa Çıkar (~' + fmt(item.currentValue()) + ')';
      sellBtn.disabled = busy;
      sellBtn.onclick = function(){ Game.doListForSale(item.id, item.currentValue()); };
      actions.appendChild(sellBtn);
    }
    body.appendChild(actions);

    if(item.owned && item.category==='arsa' && !item.forSale){
      var constrCard = document.createElement('div');
      constrCard.className = 'card';
      constrCard.style.marginBottom = '16px';
      if(item.hasHouse){
        constrCard.innerHTML = '<div class="kicker">Yapı Durumu</div><div style="margin-top:4px;font-size:0.85rem;">Bu arsanın üzerinde artık bir ev var — değeri kalıcı olarak arttı.</div>';
      } else if(item.underConstruction){
        constrCard.innerHTML = '<div class="kicker">Yapı Durumu</div><div style="margin-top:4px;font-size:0.85rem;">İnşaat sürüyor — <b>' + item.constructionDaysLeft + ' gün</b> kaldı.</div>';
      } else {
        var constrDesc = TransactionManager.startConstruction(player, item, 5);
        constrCard.innerHTML = '<div class="kicker">Yapı Durumu</div><div style="margin-top:4px;font-size:0.85rem;">Bu arsaya ev inşa ettirebilirsin — maliyet m² başına hesaplanır, bitince arsanın değeri belirgin şekilde artar.</div>';
        var constrBtn = document.createElement('button');
        constrBtn.className = 'btn-orange btn-sm';
        constrBtn.style.marginTop = '8px';
        constrBtn.textContent = 'Ev İnşa Et (~' + fmt(constrDesc.cost) + ')';
        constrBtn.disabled = busy || player.balance < constrDesc.cost;
        constrBtn.onclick = function(){ Game.doStartConstruction(item.id); };
        constrCard.appendChild(constrBtn);
      }
      body.appendChild(constrCard);
    }

    if(item.owned && item.category==='araba'){
      var kaskoCard = document.createElement('div');
      kaskoCard.className = 'card';
      kaskoCard.style.marginBottom = '16px';
      var kaskoDesc = TransactionManager.toggleKasko(player, item);
      kaskoCard.innerHTML = '<div class="kicker">Kasko Sigortası</div><div style="margin-top:4px;font-size:0.85rem;">' +
        (item.insured ? 'Sigortalı — kaza ya da gizli arıza çıkarsa zararın büyük kısmı karşılanır.' : 'Sigortasız — kaza ya da gizli arıza tüm zararı sana ait olur.') + '</div>';
      var kaskoBtn = document.createElement('button');
      kaskoBtn.className = item.insured ? 'btn-ghost btn-sm' : 'btn-orange btn-sm';
      kaskoBtn.style.marginTop = '8px';
      kaskoBtn.textContent = item.insured ? 'Kaskoyu İptal Et' : 'Kasko Yaptır';
      kaskoBtn.disabled = busy;
      kaskoBtn.onclick = function(){ Game.doToggleKasko(item.id); };
      kaskoCard.appendChild(kaskoBtn);
      body.appendChild(kaskoCard);
    }

    if(item.owned && item.pendingOffer){
      var offerCard = document.createElement('div');
      offerCard.className = 'card';
      offerCard.style.marginBottom = '16px';
      offerCard.innerHTML = '<b>' + item.pendingOffer.buyerName + '</b> teklif etti: <b>' + fmt(item.pendingOffer.offerPrice) + '</b>';
      var offerRow = document.createElement('div');
      offerRow.className = 'action-row';
      offerRow.style.marginTop = '8px'; offerRow.style.marginBottom='0';
      var accBtn = document.createElement('button');
      accBtn.className = 'btn-orange'; accBtn.textContent = 'Teklifi Kabul Et';
      accBtn.disabled = busy;
      accBtn.onclick = function(){ Game.resolveBuyerOffer(item.id, true); };
      var rejBtn = document.createElement('button');
      rejBtn.className = 'btn-ghost'; rejBtn.textContent = 'Reddet';
      rejBtn.onclick = function(){ Game.resolveBuyerOffer(item.id, false); };
      offerRow.appendChild(accBtn); offerRow.appendChild(rejBtn);
      offerCard.appendChild(offerRow);
      body.appendChild(offerCard);
    }

    if(item.category!=='dukkan' && (!item.owned || item.messages.length>0)){
      var chatbox = document.createElement('div');
      chatbox.className = 'chatbox';
      var chatTitle = document.createElement('h2');
      chatTitle.className = 'section';
      chatTitle.textContent = 'Mesajlar';
      chatbox.appendChild(chatTitle);

      if(!item.owned){
        var qbtns = document.createElement('div');
        qbtns.className = 'qbtns';
        var qList = item.category==='araba' ? CAR_QUESTIONS : ARSA_QUESTIONS;
        qList.forEach(function(q){
          var qb = document.createElement('button');
          qb.className = 'btn-ghost';
          qb.textContent = q.text;
          if(q.key==='fiyat' && item.priceAsked) qb.disabled = true;
          qb.onclick = function(){ Game.askQuestion(item.id, q.key); };
          qbtns.appendChild(qb);
        });
        chatbox.appendChild(qbtns);
      }

      item.messages.forEach(function(m){
        var b = document.createElement('div');
        b.className = 'bubble ' + (m.from==='me' ? 'me' : 'seller');
        b.textContent = m.text;
        chatbox.appendChild(b);
      });
      if(item.messages.length===0){
        var hint = document.createElement('div');
        hint.className = 'desc-note';
        hint.textContent = 'Henüz mesaj yok — yukarıdan bir soru seç.';
        chatbox.appendChild(hint);
      }
      body.appendChild(chatbox);
    }

    overlay.appendChild(body);
    return overlay;
  }
};
