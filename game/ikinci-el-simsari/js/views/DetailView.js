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
    t.textContent = item.category==='araba' ? 'Araba İlanı' : item.category==='dukkan' ? 'Dükkan İlanı' : 'Arsa İlanı';
    oh.appendChild(t);
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

    var pr = document.createElement('div');
    pr.className = 'detail-price';
    pr.textContent = fmt(item.askingPrice);
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
      if(item.faults.length===0){
        var ok = document.createElement('div');
        ok.className = 'desc-note';
        ok.style.fontStyle='normal';
        ok.textContent = 'Ekspertiz sonucu: bilinen sorun yok.';
        body.appendChild(ok);
      } else {
        var ul = document.createElement('ul');
        ul.className = 'fault-list';
        item.faults.forEach(function(f){
          var li = document.createElement('li');
          li.className = f.fixed ? 'fixed' : '';
          li.textContent = f.label + (item.category==='araba' ? (f.fixed ? ' — tamir edildi' : ' (tamiri ~' + fmt(f.repairCost) + ')') : ' (değer kaybı ~' + fmt(f.loss) + ')');
          ul.appendChild(li);
        });
        body.appendChild(ul);
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
        insBtn.onclick = function(){ Game.doInspect(item.id); };
        actions.appendChild(insBtn);
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
      var note = document.createElement('div');
      note.className = 'desc-note';
      note.style.width = '100%';
      note.textContent = 'İlanda: ' + fmt(item.listedPrice) + ' — ' + item.daysListed + ' gündür satışta, alıcı bekleniyor.';
      actions.appendChild(note);
    } else {
      var sellBtn = document.createElement('button');
      sellBtn.className = 'btn-navy';
      sellBtn.textContent = 'Satışa Çıkar (~' + fmt(item.currentValue()) + ')';
      sellBtn.disabled = busy;
      sellBtn.onclick = function(){ Game.doListForSale(item.id, item.currentValue()); };
      actions.appendChild(sellBtn);
    }
    body.appendChild(actions);

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
