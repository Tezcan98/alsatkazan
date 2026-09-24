import { Game } from '../controllers/GameController.js';
import { CAR_QUESTIONS, ARSA_QUESTIONS } from '../data/constants.js';

// =====================================================================
//  MESAJLAR (Görünüm katmanı)
// =====================================================================
// İki mod: liste (tüm mesaj/kiracı bildirimleri) ve konu (ilan sohbeti,
// SMS-tarzı SBM/TRAMER bildirimleri dahil, artı hazır soru önerileri).
export var MesajlarView = {
  render: function(container){
    var state = Game.state;
    if(state.sbmThreadOpen){
      this.renderSbmThread(container);
      return;
    }
    if(state.openMessageThreadItemId){
      this.renderThread(container, state.openMessageThreadItemId);
      return;
    }
    this.renderList(container);
  },

  renderList: function(container){
    var state = Game.state;
    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.textContent = 'Mesajlar';
    container.appendChild(h2);

    // İlan sohbetleri (buyer<->seller) — TRAMER/SBM artık burada değil,
    // kendi ayrı global konuşmasında (state.sbmMessages).
    var ilanItems = [];
    state.listings.concat(state.inventory).forEach(function(l){
      if(l.category!=='dukkan' && l.messages.length>0) ilanItems.push({kind:'ilan', item:l, ts:l.messages[l.messages.length-1].ts||0});
    });
    if(state.sbmMessages.length>0){
      ilanItems.push({kind:'sbm', ts: state.sbmMessages[state.sbmMessages.length-1].ts||0});
    }
    // En son mesajı olan konuşma en üstte — SBM de diğer ilan sohbetleriyle
    // aynı şekilde son etkinlik zamanına göre sıralanır.
    ilanItems.sort(function(a,b){ return b.ts - a.ts; });

    var kiraciItems = [];
    state.shops.forEach(function(s){
      if(s.tenant && s.tenant.pendingRequest) kiraciItems.push({kind:'kiraci', shop:s});
    });

    var items = ilanItems.concat(kiraciItems);

    if(items.length===0){
      var e = document.createElement('div'); e.className='empty'; e.textContent='Hiç mesajın yok.';
      container.appendChild(e);
      return;
    }

    items.forEach(function(entry){
      var row = document.createElement('div');
      row.className = 'listrow';

      if(entry.kind==='sbm'){
        var sbmThumb = document.createElement('div');
        sbmThumb.className = 'thumb sbm-thumb';
        sbmThumb.textContent = 'SBM';
        row.appendChild(sbmThumb);
      } else {
        var thumb = document.createElement('img');
        thumb.className = 'thumb';
        thumb.loading = 'lazy';
        var thumbSrc = entry.kind==='kiraci' ? entry.shop : entry.item;
        thumb.src = thumbSrc.thumb();
        thumb.style.filter = thumbSrc.imgFilter();
        thumb.alt = '';
        row.appendChild(thumb);
      }

      var info = document.createElement('div');
      info.className = 'info';
      var h3 = document.createElement('h3');
      h3.textContent = entry.kind==='sbm' ? 'SBM (5664)' : entry.kind==='kiraci' ? entry.shop.tenant.name + ' (kiracı)' : entry.item.title;
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
      var lastMsg;
      if(entry.kind==='kiraci') meta.textContent = entry.shop.tenant.pendingRequest.text;
      else if(entry.kind==='sbm'){
        lastMsg = Game.state.sbmMessages[Game.state.sbmMessages.length-1];
        meta.textContent = (lastMsg.from==='sbm' ? 'SBM: ' : 'Sen: ') + lastMsg.text.split('\n')[0];
      } else {
        lastMsg = entry.item.messages[entry.item.messages.length-1];
        meta.textContent = (lastMsg.from==='me' ? 'Sen: ' : 'Satıcı: ') + lastMsg.text.split('\n')[0];
      }
      info.appendChild(meta);
      row.appendChild(info);
      row.onclick = function(){
        if(entry.kind==='kiraci'){ state.tab='dukkanlar'; state.openShopId = entry.shop.id; }
        else if(entry.kind==='sbm'){ state.sbmThreadOpen = true; }
        else { state.openMessageThreadItemId = entry.item.id; }
        Game.render();
      };
      container.appendChild(row);
    });
  },

  renderSbmThread: function(container){
    var state = Game.state;
    var head = document.createElement('div');
    head.style.display = 'flex'; head.style.alignItems = 'center'; head.style.gap = '10px'; head.style.marginBottom = '10px';
    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Mesajlar';
    back.onclick = function(){ state.sbmThreadOpen = false; Game.render(); };
    head.appendChild(back);
    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.style.margin = '0';
    h2.textContent = 'SBM (5664)';
    head.appendChild(h2);
    container.appendChild(head);

    var note = document.createElement('div');
    note.className = 'desc-note';
    note.textContent = 'Sorguladığın tüm araçların TRAMER kayıt sonuçları burada, tek bir SMS akışında birikir.';
    container.appendChild(note);

    var chatbox = document.createElement('div');
    chatbox.className = 'chatbox';

    if(state.sbmMessages.length===0){
      var hint = document.createElement('div');
      hint.className = 'desc-note';
      hint.textContent = 'Henüz bir TRAMER sorgusu yapmadın.';
      chatbox.appendChild(hint);
    } else {
      var lastItemId = null;
      state.sbmMessages.forEach(function(m){
        if(m.itemId !== lastItemId){
          lastItemId = m.itemId;
          var kicker = document.createElement('div');
          kicker.className = 'sbm-group-kicker';
          kicker.textContent = m.itemTitle + (m.plate ? ' · ' + m.plate : '');
          chatbox.appendChild(kicker);
        }
        var sbmWrap = document.createElement('div');
        sbmWrap.className = 'sbm-wrap';
        var sbmLabel = document.createElement('div');
        sbmLabel.className = 'sbm-label';
        sbmLabel.textContent = m.from==='sbm' ? 'SBM (5664)' : 'Sen';
        sbmWrap.appendChild(sbmLabel);
        var sbmBubble = document.createElement('div');
        sbmBubble.className = 'bubble ' + (m.from==='sbm' ? 'sbm' : 'me');
        sbmBubble.style.whiteSpace = 'pre-line';
        sbmBubble.textContent = m.text;
        sbmWrap.appendChild(sbmBubble);
        chatbox.appendChild(sbmWrap);
      });
    }
    container.appendChild(chatbox);
  },

  renderThread: function(container, itemId){
    var state = Game.state;
    var item = Game.findAny(itemId);
    if(!item){ state.openMessageThreadItemId = null; this.renderList(container); return; }

    var head = document.createElement('div');
    head.style.display = 'flex'; head.style.alignItems = 'center'; head.style.gap = '10px'; head.style.marginBottom = '10px';
    var back = document.createElement('button');
    back.className = 'btn-ghost btn-sm';
    back.textContent = '← Mesajlar';
    back.onclick = function(){ state.openMessageThreadItemId = null; Game.render(); };
    head.appendChild(back);
    var thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = item.thumb();
    thumb.style.filter = item.imgFilter();
    thumb.alt = '';
    head.appendChild(thumb);
    var h2 = document.createElement('h2');
    h2.className = 'section';
    h2.style.margin = '0';
    h2.textContent = item.title;
    head.appendChild(h2);
    container.appendChild(head);

    var chatbox = document.createElement('div');
    chatbox.className = 'chatbox';

    if(item.messages.length===0){
      var hint = document.createElement('div');
      hint.className = 'desc-note';
      hint.textContent = 'Henüz mesaj yok — aşağıdan bir soru seç. TRAMER kaydı sonuçları ayrı SBM sohbetinde görünür.';
      chatbox.appendChild(hint);
    } else {
      // Bu artık saf alıcı<->satıcı sohbeti — SBM/TRAMER mesajları burada
      // görünmez, kendi ayrı konuşmasındadır (bkz. renderSbmThread).
      item.messages.forEach(function(m){
        var b = document.createElement('div');
        b.className = 'bubble ' + (m.from==='me' ? 'me' : 'seller');
        b.style.whiteSpace = 'pre-line';
        b.textContent = m.text;
        chatbox.appendChild(b);
      });
    }
    container.appendChild(chatbox);

    if(!item.owned){
      var qbtns = document.createElement('div');
      qbtns.className = 'qbtns';
      qbtns.style.marginTop = '10px';
      var qList = item.category==='araba' ? CAR_QUESTIONS : ARSA_QUESTIONS;
      qList.forEach(function(q){
        var qb = document.createElement('button');
        qb.className = 'btn-ghost';
        qb.textContent = q.text;
        if(q.key==='fiyat' && item.priceAsked) qb.disabled = true;
        qb.onclick = function(){ Game.askQuestion(item.id, q.key); Game.render(); };
        qbtns.appendChild(qb);
      });
      container.appendChild(qbtns);
    }
  }
};
