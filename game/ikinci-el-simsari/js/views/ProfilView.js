import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';
import { SKILL_LABELS } from '../data/constants.js';
import { IMG } from '../data/images.js';

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
    var statsDiv = document.createElement('div');
    statsDiv.style.fontSize = '0.86rem'; statsDiv.style.lineHeight = '1.7';
    statsDiv.innerHTML =
      'Toplam satış: <b>' + player.totalSales + '</b><br>' +
      'Toplam kâr/zarar: <b>' + fmt(player.totalProfit) + '</b><br>' +
      'Garajdaki ürün: <b>' + state.inventory.length + '</b><br>' +
      'Dükkan sayısı: <b>' + state.shops.length + '</b>';
    card.appendChild(statsDiv);
    container.appendChild(card);

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
