import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { SKILL_LABELS, LOAN_TIERS } from '../data/constants.js';
import { IMG } from '../data/images.js';
import { OperationManager } from '../services/OperationManager.js';
import { ACHIEVEMENTS } from '../controllers/achievements.js';

// =====================================================================
//  PROFİLİM (Görünüm katmanı) — Kontrol Paneli alt sayfası
// =====================================================================
export var ProfilView = {
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
    h2.textContent = 'Profilim';
    container.appendChild(h2);

    var card = document.createElement('div');
    card.className = 'card';
    var nameRow = document.createElement('div');
    nameRow.style.display='flex'; nameRow.style.gap='10px'; nameRow.style.marginBottom='10px'; nameRow.style.alignItems='center';
    var avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = IMG.icon.avatar; avatar.alt = 'Profil';
    nameRow.appendChild(avatar);
    var input = document.createElement('input');
    input.value = player.name;
    input.style.flex='1'; input.style.padding='7px'; input.style.border='1px solid var(--border)'; input.style.borderRadius='4px';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-ghost btn-sm';
    saveBtn.textContent = 'Kaydet';
    saveBtn.onclick = function(){ player.name = input.value || 'Simsar'; Game.render(); };
    nameRow.appendChild(input); nameRow.appendChild(saveBtn);
    card.appendChild(nameRow);
    var stars = Game.reputationStars();
    var starsStr = '★★★★★'.slice(0, Math.round(stars)) + '☆☆☆☆☆'.slice(0, 5-Math.round(stars));
    var statsDiv = document.createElement('div');
    statsDiv.style.fontSize = '0.86rem'; statsDiv.style.lineHeight = '1.7';
    statsDiv.innerHTML =
      'Satıcı puanı: <b style="color:var(--orange-dark);">' + starsStr + '</b> (' + stars.toFixed(1) + ' / 5)<br>' +
      'Toplam satış: <b>' + player.totalSales + '</b><br>' +
      'Toplam kâr/zarar: <b>' + fmt(player.totalProfit) + '</b><br>' +
      'Garajdaki ürün: <b>' + state.inventory.length + '</b><br>' +
      'Dükkan sayısı: <b>' + state.shops.length + '</b>';
    card.appendChild(statsDiv);
    container.appendChild(card);

    var h2l = document.createElement('h2');
    h2l.className = 'section';
    h2l.textContent = 'Banka Kredisi';
    container.appendChild(h2l);
    var loanCard = document.createElement('div');
    loanCard.className = 'card';
    var busy = OperationManager.isBusy();
    if(player.loan){
      var loan = player.loan;
      loanCard.innerHTML =
        '<div class="kicker">Açık kredi</div>' +
        '<div style="font-size:0.85rem;line-height:1.7;margin-top:4px;">' +
        'Kalan borç: <b>' + fmt(loan.remaining) + '</b><br>' +
        'Günlük faiz: <b>%' + (loan.dailyRate*100).toFixed(1) + '</b><br>' +
        'Günlük asgari ödeme: <b>' + fmt(loan.dailyPayment) + '</b> (otomatik düşülür)' +
        '</div>';
      var payBtn = document.createElement('button');
      payBtn.className = 'btn-orange btn-sm';
      payBtn.style.marginTop = '8px';
      payBtn.textContent = 'Tamamını Öde (' + fmt(loan.remaining) + ')';
      payBtn.disabled = busy || player.balance < loan.remaining;
      payBtn.onclick = function(){ Game.repayLoan(); };
      loanCard.appendChild(payBtn);
    } else {
      var loanDesc = document.createElement('div');
      loanDesc.className = 'kicker';
      loanDesc.textContent = 'Büyük bir alım için nakit lazımsa bankadan kredi çekebilirsin — her gün faiz işler ve bakiyenden otomatik asgari ödeme düşülür.';
      loanCard.appendChild(loanDesc);
      var tierRow = document.createElement('div');
      tierRow.style.display = 'flex'; tierRow.style.gap = '6px'; tierRow.style.flexWrap = 'wrap'; tierRow.style.marginTop = '8px';
      LOAN_TIERS.forEach(function(tier, idx){
        var btn = document.createElement('button');
        btn.className = 'btn-ghost btn-sm';
        btn.textContent = fmt(tier.amount) + ' (%' + (tier.dailyRate*100).toFixed(1) + '/gün)';
        btn.disabled = busy;
        btn.onclick = function(){ Game.takeLoan(idx); };
        tierRow.appendChild(btn);
      });
      loanCard.appendChild(tierRow);
    }
    container.appendChild(loanCard);

    var h2b = document.createElement('h2');
    h2b.className = 'section';
    h2b.textContent = 'Yetenekler';
    container.appendChild(h2b);
    var grid = document.createElement('div');
    grid.className = 'grid';
    Object.keys(SKILL_LABELS).forEach(function(key){
      var lvl = player.skillLevel(key);
      var c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = '<h3>' + SKILL_LABELS[key] + '</h3><div class="val">Seviye ' + lvl + ' / 10</div>' +
        '<div class="skillbar"><div class="skillbar-fill" style="width:' + (lvl*10) + '%;"></div></div>';
      grid.appendChild(c);
    });
    container.appendChild(grid);

    var h2a = document.createElement('h2');
    h2a.className = 'section';
    h2a.innerHTML = 'Başarımlar <span class="count">(' + player.achievements.length + ' / ' + ACHIEVEMENTS.length + ')</span>';
    container.appendChild(h2a);
    var achGrid = document.createElement('div');
    achGrid.className = 'grid';
    ACHIEVEMENTS.forEach(function(a){
      var unlocked = player.achievements.indexOf(a.id) >= 0;
      var ac = document.createElement('div');
      ac.className = 'card';
      if(!unlocked) ac.style.opacity = '0.45';
      ac.innerHTML = '<h3>' + (unlocked ? a.title : '??? ') + '</h3>' +
        '<div class="kicker">' + (unlocked ? a.desc : 'Henüz açılmadı') + '</div>';
      achGrid.appendChild(ac);
    });
    container.appendChild(achGrid);

    var h2c = document.createElement('h2');
    h2c.className = 'section';
    h2c.textContent = 'İşlem Defteri';
    container.appendChild(h2c);
    var log = document.createElement('div');
    log.className = 'log';
    if(state.log.length===0){
      log.innerHTML = '<div>Henüz işlem yok.</div>';
    } else {
      state.log.forEach(function(l){
        var d = document.createElement('div');
        if(l.cls) d.className = l.cls;
        d.textContent = l.msg;
        log.appendChild(d);
      });
    }
    container.appendChild(log);
  }
};
