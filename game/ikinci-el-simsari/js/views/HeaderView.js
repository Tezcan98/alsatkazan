import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';

// =====================================================================
//  HEADER (Görünüm katmanı)
// =====================================================================
export var HeaderView = {
  update: function(){
    var player = Game.player, state = Game.state;
    var balanceEl = document.getElementById('balance');
    balanceEl.textContent = fmt(player.balance);
    balanceEl.className = player.balance<0 ? 'negv' : '';
    document.getElementById('day').textContent = state.day;
    var profit = player.balance - player.startBalance;
    var profitEl = document.getElementById('profit');
    profitEl.textContent = fmt(profit);
    profitEl.className = profit<0 ? 'negv' : '';
    document.getElementById('invcount').textContent = state.inventory.length;
    document.getElementById('clockline').textContent = 'Gün ' + state.day;
  }
};
