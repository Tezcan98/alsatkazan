import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { buildCarPartsDiagram } from './CarPartsDiagram.js';
import { KASKO_MIN_DAILY, KASKO_DAILY_RATE, KASKO_DEDUCTIBLE } from '../data/constants.js';

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

    if(!item.owned && (item.galeriName || item.sellerName)){
      var sellerLine = document.createElement('div');
      sellerLine.className = 'desc-note';
      sellerLine.style.fontStyle = 'normal';
      sellerLine.style.marginBottom = '2px';
      sellerLine.innerHTML = item.galeriName
        ? '<b>' + item.galeriName + '</b> <span class="tag-chip">Galeri</span>'
        : 'Satıcı: <b>' + item.sellerName + '</b>';
      body.appendChild(sellerLine);
    }

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

    if(item.inspected && !item.owned && item.ekspertizDone){
      var mismatches = Game.expertDiscrepancy(item);
      if(mismatches.length){
        var nego = document.createElement('div');
        nego.className = 'card';
        nego.style.marginTop = '10px';
        nego.style.borderColor = '#e1b12c';
        var nk = document.createElement('div');
        nk.className = 'kicker';
        nk.textContent = 'EKSPERTİZ FARKI';
        nego.appendChild(nk);
        var nt = document.createElement('div');
        nt.style.marginTop = '5px';
        nt.textContent = 'Satıcının önceki beyanı ile ekspertiz sonucu uyuşmuyor. Bu farkı koz olarak kullanıp fiyatı aşağı çekebilirsin.';
        nego.appendChild(nt);
        var nb = document.createElement('button');
        nb.className = 'btn-orange btn-sm';
        nb.style.marginTop = '8px';
        nb.textContent = item.negotiationDone ? 'Pazarlık yapıldı' : 'Ekspertiz farkıyla pazarlık yap';
        nb.disabled = item.negotiationDone || busy;
        nb.onclick = function(){ Game.negotiateExpertDiscrepancy(item.id); };
        nego.appendChild(nb);
        body.appendChild(nego);
      }
    }

    if(item.ekspertizDone && item.inspectionReport){
      var report = document.createElement('div');
      report.className='card';
      report.style.marginTop='10px';
      report.style.borderColor='#2f855a';
      var rk=document.createElement('div'); rk.className='kicker'; rk.textContent='EKSPERTİZ RAPORU'; report.appendChild(rk);
      var rt=document.createElement('div'); rt.style.marginTop='6px';
      var visibleCount=item.inspectionReport.visibleFaults.length;
      rt.textContent = visibleCount
        ? visibleCount+' tespit edilen sorun bulundu.'
        : 'İncelenen alanlarda tespit edilen bir sorun bulunmadı.';
      report.appendChild(rt);
      if(visibleCount){
        var rl=document.createElement('ul'); rl.className='fault-list';
        item.inspectionReport.visibleFaults.forEach(function(label){var li=document.createElement('li');li.textContent=label;rl.appendChild(li);});
        report.appendChild(rl);
      }
      if(item.inspectionReport.missedCount>0){
        var rn=document.createElement('div'); rn.className='desc-note'; rn.style.fontStyle='normal';
        rn.textContent=item.inspectionReport.missedCount+' küçük kusur ekspertizde gözden kaçmış olabilir.';
        report.appendChild(rn);
      }
      body.appendChild(report);
    }

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
      if(!item.owned && item.ekspertizDone && item.category==='araba' && !item.tramerDone){
        var qnote = document.createElement('div');
        qnote.className = 'desc-note';
        qnote.textContent = 'Ekspertiz mekanik/boya arızalarını gösterir ama ağır hasar kaydı için ayrıca TRAMER sorgulaman gerekir.';
        body.appendChild(qnote);
      }
    }

    if(item.category==='araba' && item.tramerDone){
      var tramerCard = document.createElement('div');
      tramerCard.className = 'card';
      tramerCard.style.marginTop = '10px';
      tramerCard.style.borderColor = '#5b8def';
      var tk = document.createElement('div');
      tk.className = 'kicker';
      tk.textContent = 'TRAMER SONUCU';
      tramerCard.appendChild(tk);
      var tramerFindings = item.tramerFindings || [];
      var tramerText = document.createElement('div');
      tramerText.style.marginTop = '5px';
      tramerText.textContent = tramerFindings.length
        ? tramerFindings.length + ' kayıt bulundu. Satıcının kaporta işaretleriyle karşılaştırıldı.'
        : 'Kayıtlı ağır hasar sonucu bulunmadı.';
      tramerCard.appendChild(tramerText);
      var tramerMismatch = Game.tramerDiscrepancy(item);
      if(tramerMismatch.length && !item.owned){
        var tm = document.createElement('div');
        tm.style.marginTop='7px';
        tm.textContent = tramerMismatch.map(function(f){
          var part = item.partStatus && f.partKey ? item.partStatus[f.partKey] : 'orijinal';
          return f.label + ' — satıcı şemada bu bölümü işaretlememiş.';
        }).join(' ');
        tramerCard.appendChild(tm);
        var tb = document.createElement('button');
        tb.className='btn-orange btn-sm';
        tb.style.marginTop='8px';
        tb.textContent=item.tramerNegotiationDone?'TRAMER farkıyla pazarlık yapıldı':'TRAMER farkıyla pazarlık yap';
        tb.disabled=item.tramerNegotiationDone || busy;
        tb.onclick=function(){Game.negotiateTramerDiscrepancy(item.id);};
        tramerCard.appendChild(tb);
      }
      body.appendChild(tramerCard);
    }

    var actions = document.createElement('div');
    actions.className = 'action-row';
    if(!item.owned){
      if(item.category!=='dukkan'){
        if(!item.ekspertizDone){
          var insDesc = TransactionManager.inspection(player, item);
          var inspectionHere = !item.location || item.location === player.currentCity;
          var insBtn = document.createElement('button');
          insBtn.className = 'btn-ghost';
          insBtn.textContent = 'Ekspertiz Yaptır (' + fmt(insDesc.cost) + ')';
          insBtn.disabled = busy || !inspectionHere;
          insBtn.onclick = function(){ Game.doInspect(item.id); };
          actions.appendChild(insBtn);
          if(!inspectionHere){
            var cityNote = document.createElement('div');
            cityNote.className = 'desc-note'; cityNote.style.width='100%'; cityNote.style.fontStyle='normal';
            cityNote.textContent = 'Ekspertiz yerinde yapılır. Önce ' + item.location + ' şehrine gitmelisin.';
            actions.appendChild(cityNote);
          }
        } else {
          var doneBtn = document.createElement('button');
          doneBtn.className='btn-ghost';
          doneBtn.textContent='✓ Ekspertiz Tamamlandı';
          doneBtn.disabled=true;
          actions.appendChild(doneBtn);
        }
      }
      if(item.category==='araba' && !item.tramerDone){
        var tramerDesc = TransactionManager.tramerQuery(player, item);
        var tramerBtn = document.createElement('button');
        tramerBtn.className = 'btn-ghost';
        tramerBtn.textContent = 'TRAMER Kaydı Sorgula (' + fmt(tramerDesc.cost) + ')';
        tramerBtn.disabled = busy;
        tramerBtn.onclick = function(){ Game.doTramerQuery(item.id); };
        actions.appendChild(tramerBtn);
      }
      var needsTravel = item.category==='araba' && item.location && item.location !== player.currentCity;
      if(needsTravel){
        var travelNote = document.createElement('div');
        travelNote.className = 'desc-note';
        travelNote.style.width = '100%';
        travelNote.style.fontStyle = 'normal';
        travelNote.textContent = 'Bu araç ' + item.location + ' şehrinde satılıyor — satın almak için önce oraya gitmelisin.';
        actions.appendChild(travelNote);
        var goCityBtn = document.createElement('button');
        goCityBtn.className = 'btn-navy';
        goCityBtn.textContent = item.location + '\'e Git';
        goCityBtn.disabled = busy;
        goCityBtn.onclick = function(){
          state.openDetailId = null;
          state.mapSelectedCity = null;
          state.travelTargetCity = item.location;
          state.tab = 'harita';
          Game.render();
        };
        actions.appendChild(goCityBtn);
      } else {
        var buyBtn = document.createElement('button');
        buyBtn.className = 'btn-orange';
        buyBtn.textContent = item.category==='dukkan' ? 'Devren Satın Al' : 'Satın Al';
        buyBtn.disabled = busy || player.balance < item.askingPrice;
        buyBtn.onclick = function(){ Game.doBuy(item.id); };
        actions.appendChild(buyBtn);
        if(item.category==='dukkan'){
          var rentBtn = document.createElement('button');
          rentBtn.className = 'btn-navy';
          rentBtn.textContent = 'Kirala (' + fmt(Math.round(item.rent * item.rentMult)) + '/ay)';
          rentBtn.disabled = busy || player.balance < Math.round(item.rent * item.rentMult);
          rentBtn.onclick = function(){ Game.doRentShop(item.id); };
          actions.appendChild(rentBtn);
        }
      }
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
      var dailyPremium = Math.max(KASKO_MIN_DAILY, Math.round(item.currentValue()*KASKO_DAILY_RATE));
      kaskoCard.innerHTML = '<div class="kicker">Kasko Sigortası</div><div style="margin-top:4px;font-size:0.85rem;">' +
        (item.insured
          ? 'Sigortalı — günlük ~' + fmt(dailyPremium) + ' prim ödüyorsun. Kaza olursa hasar kalemi otomatik tamir edilir, sadece ' + fmt(KASKO_DEDUCTIBLE) + ' muafiyet ödersin.'
          : 'Sigortasız — bir kaza olursa hasar bedelinin tamamı (genelde birkaç on binden yüz binlerce TL\'ye kadar) senden çıkar. Kaskoyla günlük ~' + fmt(dailyPremium) + ' prim karşılığında bu riski ' + fmt(KASKO_DEDUCTIBLE) + ' muafiyete indirirsin.') + '</div>';
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

    if(item.category!=='dukkan' && !item.owned){
      var msgCard = document.createElement('div');
      msgCard.className = 'card';
      msgCard.style.marginBottom = '16px';
      msgCard.innerHTML = '<div class="kicker">İletişim</div><div style="margin-top:4px;font-size:0.85rem;">' +
        (item.messages.length>0 ? 'Bu ilanla ilgili mesajlaşman var.' : 'Satıcıya soru sormak veya fiyat pazarlığı yapmak için mesaj at.') + '</div>';
      var msgBtn = document.createElement('button');
      msgBtn.className = 'btn-navy btn-sm';
      msgBtn.style.marginTop = '8px';
      msgBtn.textContent = item.messages.length>0 ? 'Mesajlaşmayı Aç' : 'Satıcıya Mesaj At';
      msgBtn.onclick = function(){
        state.openMessageThreadItemId = item.id;
        state.openDetailId = null;
        state.tab = 'mesajlar';
        Game.render();
      };
      msgCard.appendChild(msgBtn);
      body.appendChild(msgCard);
    }

    overlay.appendChild(body);
    return overlay;
  }
};
