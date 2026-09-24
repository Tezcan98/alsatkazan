import { Game } from './controllers/GameController.js';
import { OperationManager } from './services/OperationManager.js';
import { HeaderView } from './views/HeaderView.js';
import { ListingsView } from './views/ListingsView.js';
import { DetailView } from './views/DetailView.js';
import { GarageView } from './views/GarageView.js';
import { UstalarView } from './views/UstalarView.js';
import { DukkanlarView } from './views/DukkanlarView.js';
import { MesajlarView } from './views/MesajlarView.js';
import { ProfilView } from './views/ProfilView.js';
import { ControlPanelView } from './views/ControlPanelView.js';
import { MapView } from './views/MapView.js';

// =====================================================================
//  ANA GİRİŞ — sekmeleri görünümlere yönlendirir, alt barı yönetir
// =====================================================================
var PANEL_CHILD_TABS = ['ustalar','dukkanlar','profil','harita'];

function render(){
  HeaderView.update();

  var main = document.getElementById('main');
  main.innerHTML = '';
  main.classList.remove('fadein');
  void main.offsetWidth;
  main.classList.add('fadein');

  var tab = Game.state.tab;
  if(tab==='listings') ListingsView.render(main);
  else if(tab==='garage') GarageView.render(main);
  else if(tab==='mesajlar') MesajlarView.render(main);
  else if(tab==='panel') ControlPanelView.render(main);
  else if(tab==='ustalar') UstalarView.render(main);
  else if(tab==='dukkanlar') DukkanlarView.render(main);
  else if(tab==='profil') ProfilView.render(main);
  else if(tab==='harita') MapView.render(main);

  var activeNavTab = PANEL_CHILD_TABS.indexOf(tab) >= 0 ? 'panel' : tab;
  document.querySelectorAll('#bottombar button').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab===activeNavTab);
  });

  var existingOverlay = document.querySelector('.overlay');
  if(existingOverlay) existingOverlay.remove();
  if(Game.state.openDetailId){
    var ov = DetailView.render();
    if(ov) document.body.appendChild(ov);
    else Game.state.openDetailId = null;
  }
}

Game.render = render;

document.querySelectorAll('#bottombar button').forEach(function(b){
  b.onclick = function(){
    // İşlem sürerken bile sekmeler arasında serbestçe gezinilebilir —
    // sadece yeni ücretli işlem başlatmak engellenir (Game.perform içinde).
    Game.state.tab = b.dataset.tab;
    Game.state.openShopId = null;
    Game.state.openDetailId = null;
    Game.state.openMessageThreadItemId = null;
    Game.state.sbmThreadOpen = false;
    render();
  };
});

Game.init();
render();
