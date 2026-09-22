import { rnd, pick, clamp, fmt, toast } from '../utils.js';
import { Player } from '../models/Player.js';
import { Market } from '../services/Market.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { ConfirmDialog } from '../services/ConfirmDialog.js';
import {
  CAR_QUESTIONS, ARSA_QUESTIONS, USTALAR, MASRAF_OPTIONS,
  TENANT_NAMES, TENANT_BUSINESS_ARABA, TENANT_BUSINESS_ARSA,
  BUYER_NAMES, BUYER_DISCOUNT_LINES
} from '../data/constants.js';

// =====================================================================
//  OYUN DENETLEYİCİSİ (Controller katmanı)
// =====================================================================
// Durumu (state) ve tüm oyun eylemlerini tutar; Model'leri (Player,
// Listing/Car/Land/Shop) ve Servisleri (Market, TransactionManager,
// OperationManager, ConfirmDialog) birbirine bağlar. Views bu modülü
// import edip Game.state / Game.player okur ve Game.doXxx() çağırır.
export var Game = {
  state: {
    day: 1,
    listings: [],
    inventory: [],
    shops: [],
    parts: {},
    partsMarket: [],
    log: [],
    tab: "listings",
    listingFilter: "hepsi",
    openDetailId: null,
    openShopId: null,
    controlPanelOpen: false
  },
  player: new Player(),
  render: function(){ /* main.js tarafından değiştirilir */ },

  init: function(){
    ConfirmDialog.init();
    OperationManager.init();
    this.state.listings = Market.refreshListings();
    this.state.partsMarket = Market.refreshPartsMarket();
    this.addLog('Simsarlığa hoş geldin. Kasanla ilan al, incele, tamir ettir, kârına sat.');
  },

  addLog: function(msg, cls){
    this.state.log.unshift({msg:msg, cls:cls||""});
    if(this.state.log.length>50) this.state.log.pop();
  },

  findListing: function(id){ return this.state.listings.find(function(l){return l.id===id;}); },
  findInv: function(id){ return this.state.inventory.find(function(l){return l.id===id;}); },
  findAny: function(id){ return this.findListing(id) || this.findInv(id); },

  // ---- genel işlem çalıştırıcı: TransactionManager'dan tanım alır,
  //      onaya sorar, süre bekletir, sonra efekt uygular ----
  perform: function(desc, effectFn){
    if(OperationManager.isBusy()) { toast('Önceki işlem bitmeden yeni işlem başlatamazsın.'); return; }
    var player = this.player;
    if(desc.cost && !player.canAfford(desc.cost)){ toast('Bakiye yetersiz.'); return; }
    function go(){ OperationManager.run(desc, effectFn); }
    if(desc.skipConfirm){ go(); } else { ConfirmDialog.ask(desc, go); }
  },

  // =====================================================================
  //  EYLEMLER
  // =====================================================================
  doInspect: function(id){
    var self = this, state = this.state, player = this.player;
    var item = this.findAny(id);
    if(!item || item.inspected) return;
    var desc = TransactionManager.inspection(player, item);
    this.perform(desc, function(){
      player.spend(desc.cost);
      item.inspected = true;
      self.addLog('Ekspertiz yaptırıldı: ' + item.title + ' — ' + fmt(desc.cost), 'neg');
      player.addXp('ekspertiz', 25);
      self.render();
    });
  },

  doBuy: function(id){
    var self = this, state = this.state, player = this.player;
    var item = this.findListing(id);
    if(!item) return;
    var wasInspected = item.inspected;
    var desc = TransactionManager.purchase(player, item);
    this.perform(desc, function(){
      var idx = state.listings.findIndex(function(l){return l.id===id;});
      if(idx<0) return;
      state.listings.splice(idx,1);
      player.spend(desc.cost);
      item.owned = true;
      item.purchasePrice = desc.cost;
      if(item.category==='dukkan'){
        state.shops.push(item);
        self.addLog('Devren satın alındı: ' + item.title + ' — ' + fmt(item.purchasePrice), 'neg');
        toast('Dükkan alındı, Kontrol Paneli → Dükkanlarım.');
      } else {
        item.inspected = true;
        item.shopId = null;
        state.inventory.push(item);
        self.addLog('Satın alındı: ' + item.title + ' — ' + fmt(item.purchasePrice), 'neg');
        toast('Satın alındı, Garajım sekmesinde.');
        player.addXp('pazarlik', 3);
        self.checkForKazik(item, wasInspected);
      }
      state.openDetailId = null;
      self.render();
    });
  },

  // Ekspertiz yaptırmadan alınan ürünlerde gizli arıza çıkarsa "kazık
  // yedin" olayı tetiklenir: Sabır seviyesi yükseldikçe zararın bir kısmı
  // telafi edilir (item.trueValue'ya geri eklenir) ve Sabır XP kazanılır.
  checkForKazik: function(item, wasInspected){
    if(wasInspected) return;
    var totalLoss = item.faults.reduce(function(s,f){return s+f.loss;},0);
    if(totalLoss < 15000) return;
    var player = this.player;
    var sabirLvl = player.skillLevel('sabir');
    var mitigation = clamp(sabirLvl*0.03, 0, 0.3);
    var recovered = Math.round(totalLoss*mitigation);
    if(recovered>0) item.trueValue += recovered;
    this.addLog('Kazık yedin! ' + item.title + ' üzerinde ' + fmt(totalLoss) + ' değerinde gizli arıza çıktı' + (recovered>0 ? ' (Sabır sayesinde ' + fmt(recovered) + ' telafi edildi)' : '') + '.', 'neg');
    toast('Ekspertizsiz alım risklidir — kazık yedin!');
    player.addXp('sabir', clamp(Math.round(totalLoss/900), 6, 35));
  },

  askQuestion: function(id, key){
    var state = this.state;
    var item = this.findAny(id);
    if(!item) return;
    var qList = item.category==='araba' ? CAR_QUESTIONS : ARSA_QUESTIONS;
    var q = qList.find(function(x){return x.key===key;});
    if(!q) return;
    item.messages.push({from:'me', text:q.text});

    var reply;
    if(key==='fiyat'){
      if(item.priceAsked){
        reply = "Zaten son fiyatı söylemiştim: " + fmt(item.askingPrice) + ".";
      } else {
        var pLvl = this.player.skillLevel('pazarlik');
        var chance = clamp(0.5 + pLvl*0.04, 0.3, 0.9);
        if(Math.random() < chance){
          var disc = clamp((rnd(3,9) + pLvl)/100, 0.02, 0.22);
          item.askingPrice = Math.round(item.askingPrice*(1-disc));
          reply = "Peki, sizin için son fiyat " + fmt(item.askingPrice) + " olsun.";
        } else {
          reply = "Fiyatta esnek değilim, ilandaki fiyat geçerli.";
        }
        item.priceAsked = true;
        this.player.addXp('pazarlik', 12);
      }
    } else {
      if(item.inspected){
        var present = item.faults.some(function(f){return f.tag===key;});
        reply = present
          ? "Evet, " + item.faults.filter(function(f){return f.tag===key;}).map(function(f){return f.label;}).join(', ') + " mevcut, ekspertizde de çıkmıştır."
          : "Hayır, o konuda bir sorun yok, ekspertiz de temizdir.";
      } else {
        var present2 = item.faults.some(function(f){return f.tag===key;});
        if(present2){
          if(Math.random() < item.sellerHonesty){
            reply = "Açık konuşayım, ufak bir " + (key==='hasar' ? 'kayıt' : key==='motor' ? 'sorun' : key==='boya' ? 'boya işlemi' : key==='tapu' ? 'kayıt' : key==='yol' ? 'durum' : 'husus') + " var ama fiyata yansıttım zaten.";
          } else {
            reply = "Hayır, kesinlikle öyle bir şey yok, çok temiz.";
          }
        } else {
          reply = "Hayır, gayet temiz, o konuda hiç sorun yok.";
        }
      }
    }
    item.messages.push({from:'seller', text:reply});
    this.render();
  },

  doRepair: function(itemId, faultIdx, ustaId){
    var self = this, state = this.state, player = this.player;
    var item = this.findInv(itemId);
    if(!item) return;
    var f = item.faults[faultIdx];
    if(!f || f.fixed) return;
    var usta = USTALAR.find(function(u){return u.id===ustaId;});
    if(!usta) return;
    var partKey = item.brand + '|' + f.tag;
    var usesPart = (state.parts[partKey]||0) > 0;
    var desc = TransactionManager.repair(player, item, f, usta, usesPart);
    this.perform(desc, function(){
      player.spend(desc.cost);
      if(usesPart) state.parts[partKey] -= 1;
      var ok = Math.random() < desc.successChance;
      if(ok){
        f.fixed = true;
        self.addLog(usta.name + ' tamir etti: ' + item.title + ' — "' + f.label + '" — ' + fmt(desc.cost) + (usesPart ? ' (kendi parçanla)' : ''), 'neg');
        toast('Tamir başarılı: ' + f.label);
      } else {
        self.addLog(usta.name + ' işi bitiremedi: ' + item.title + ' — "' + f.label + '" — ' + fmt(desc.cost) + ' (boşa gitti)', 'neg');
        toast('Tamir başarısız oldu, para gitti.');
        player.addXp('sabir', 8);
      }
      player.addXp('tamir', ok ? 10 : 4);
      self.render();
    });
  },

  doSelfRepair: function(itemId, faultIdx){
    var self = this, state = this.state, player = this.player;
    var item = this.findInv(itemId);
    if(!item) return;
    var f = item.faults[faultIdx];
    if(!f || f.fixed) return;
    var partKey = item.brand + '|' + f.tag;
    if((state.parts[partKey]||0) <= 0){ toast('Bu araç markası için parçan yok.'); return; }
    var lvl = player.skillLevel('tamir');
    if(lvl < 3){ toast('Kendin yapabilmek için Tamir Ustalığı en az 3 olmalı.'); return; }
    var desc = TransactionManager.selfRepair(player, item, f);
    this.perform(desc, function(){
      state.parts[partKey] -= 1;
      var ok = Math.random() < desc.successChance;
      if(ok){
        f.fixed = true;
        self.addLog('Kendin tamir ettin: ' + item.title + ' — "' + f.label + '" (parça kullanıldı)', 'neg');
        toast('Kendi elinle tamir ettin!');
      } else {
        self.addLog('Kendin denedin ama olmadı: ' + item.title + ' — "' + f.label + '" (parça harcandı)', 'neg');
        toast('Olmadı, parça boşa gitti ama tecrübe kazandın.');
        player.addXp('sabir', 10);
      }
      player.addXp('tamir', ok ? 20 : 8);
      self.render();
    });
  },

  // ---- Garaj ürününü satışa çıkarma (anında satmaz) ----
  // "Sat" artık tek tıkla anında para getirmiyor: ürün ilana çıkar,
  // her gün geçişinde şansa bağlı olarak bir alıcı ilgilenir — bazen
  // direkt fiyata razı olur, bazen indirim için mesaj atar.
  doListForSale: function(id, price){
    var self = this, state = this.state, player = this.player;
    var item = this.findInv(id);
    if(!item || item.forSale) return;
    var askPrice = Math.max(500, Math.round(price || item.currentValue()));
    var desc = TransactionManager.listForSale(player, item, askPrice);
    this.perform(desc, function(){
      item.forSale = true;
      item.listedPrice = askPrice;
      item.daysListed = 0;
      item.pendingOffer = null;
      self.addLog(item.title + ' satışa çıkarıldı: ' + fmt(askPrice), '');
      toast('İlana çıkarıldı — alıcılar gün geçtikçe ilgilenecek.');
      self.render();
    });
  },

  doUnlist: function(id){
    var item = this.findInv(id);
    if(!item) return;
    item.forSale = false;
    item.pendingOffer = null;
    this.addLog(item.title + ' satıştan kaldırıldı.');
    this.render();
  },

  // Envanterdeki bir ürünün nihai satışını tamamlar (ortak mantık):
  // parayı yatırır, kâr/zarar loglar, istatistikleri günceller.
  completeInventorySale: function(item, salePrice, viaLabel){
    var state = this.state, player = this.player;
    var idx = state.inventory.findIndex(function(l){return l.id===item.id;});
    if(idx<0) return;
    player.earn(salePrice);
    var profit = salePrice - item.purchasePrice;
    if(item.shopId){
      var sh = state.shops.find(function(s){return s.id===item.shopId;});
      if(sh) sh.slots = sh.slots.filter(function(x){return x!==item.id;});
    }
    state.inventory.splice(idx,1);
    this.addLog((viaLabel||'Satıldı') + ': ' + item.title + ' — ' + fmt(salePrice) + ' (' + (profit>=0?'kâr ':'zarar ') + fmt(Math.abs(profit)) + ')', profit>=0?'pos':'neg');
    player.addXp('pazarlik', 6);
    player.totalSales += 1;
    player.totalProfit += profit;
  },

  // Bir alıcının indirim teklifini kabul/reddet.
  resolveBuyerOffer: function(id, accept){
    var self = this, state = this.state, player = this.player;
    var item = this.findInv(id);
    if(!item || !item.pendingOffer) return;
    var offer = item.pendingOffer;
    if(!accept){
      item.pendingOffer = null;
      item.messages.push({from:'seller', text:'Tamam, o zaman şimdilik ' + fmt(item.listedPrice) + ' fiyatta bekliyorum.'});
      this.addLog(offer.buyerName + '\'in teklifi reddedildi: ' + fmt(offer.offerPrice), '');
      this.render();
      return;
    }
    var desc = TransactionManager.acceptOffer(player, item, offer.offerPrice);
    this.perform(desc, function(){
      item.forSale = false;
      item.pendingOffer = null;
      self.completeInventorySale(item, offer.offerPrice, offer.buyerName + ' ile anlaşıldı');
      state.openDetailId = null;
      self.render();
    });
  },

  assignToShop: function(shopId, itemId){
    var state = this.state;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    var item = this.findInv(itemId);
    if(!shop || !item) return;
    if(item.category !== shop.accepts){ toast('Bu dükkan bu türü kabul etmiyor.'); return; }
    if(shop.slots.length >= shop.capacity){ toast('Vitrin dolu.'); return; }
    if(item.shopId){ toast('Bu ürün zaten bir vitrinde.'); return; }
    shop.slots.push(item.id);
    item.shopId = shop.id;
    this.addLog(item.title + ' vitrine kondu: ' + shop.title);
    this.render();
  },

  unassignFromShop: function(shopId, itemId){
    var state = this.state;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    var item = this.findInv(itemId);
    if(!shop || !item) return;
    shop.slots = shop.slots.filter(function(id){return id!==itemId;});
    item.shopId = null;
    this.addLog(item.title + ' vitrinden alındı: ' + shop.title);
    this.render();
  },

  doSellFromShop: function(shopId, itemId){
    var self = this, state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    var item = this.findInv(itemId);
    if(!shop || !item) return;
    var desc = TransactionManager.sale(player, item, true);
    this.perform(desc, function(){
      var idx = state.inventory.findIndex(function(l){return l.id===itemId;});
      if(idx<0) return;
      var value = item.currentValue();
      var iLvl = player.skillLevel('isletme');
      var negotiation = 0.97 + Math.random()*(0.18 + iLvl*0.01);
      var salePrice = Math.round(value*negotiation*(shop.saleBonus||1));
      player.earn(salePrice);
      var profit = salePrice - item.purchasePrice;
      shop.slots = shop.slots.filter(function(id){return id!==itemId;});
      state.inventory.splice(idx,1);
      self.addLog(shop.title + '\'de satıldı: ' + item.title + ' — ' + fmt(salePrice) + ' (' + (profit>=0?'kâr ':'zarar ') + fmt(Math.abs(profit)) + ')', profit>=0?'pos':'neg');
      player.addXp('isletme', 8);
      player.totalSales += 1;
      player.totalProfit += profit;
      self.render();
    });
  },

  // pasif (otomatik gün sonu) vitrin satışı — onay istemeden, anında
  passiveShopSell: function(shopId, itemId){
    var state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    var idx = state.inventory.findIndex(function(l){return l.id===itemId;});
    if(!shop || idx<0) return;
    var item = state.inventory[idx];
    var value = item.currentValue();
    var iLvl = player.skillLevel('isletme');
    var negotiation = 0.97 + Math.random()*(0.18 + iLvl*0.01);
    var salePrice = Math.round(value*negotiation*(shop.saleBonus||1));
    player.earn(salePrice);
    var profit = salePrice - item.purchasePrice;
    shop.slots = shop.slots.filter(function(id){return id!==itemId;});
    state.inventory.splice(idx,1);
    this.addLog(shop.title + '\'de müşteri çıktı: ' + item.title + ' — ' + fmt(salePrice) + ' (' + (profit>=0?'kâr ':'zarar ') + fmt(Math.abs(profit)) + ')', profit>=0?'pos':'neg');
    player.addXp('isletme', 8);
    player.totalSales += 1;
    player.totalProfit += profit;
  },

  doBuyPart: function(brand, tag){
    var self = this, state = this.state, player = this.player;
    var m = state.partsMarket.find(function(p){return p.brand===brand && p.tag===tag;});
    if(!m) return;
    var desc = TransactionManager.buyPart(player, brand, m);
    this.perform(desc, function(){
      player.spend(desc.cost);
      var key = brand + '|' + tag;
      state.parts[key] = (state.parts[key]||0) + 1;
      self.addLog('Yedek parça alındı: ' + brand + ' ' + m.name + ' — ' + fmt(desc.cost), 'neg');
      self.render();
    });
  },

  doShopUpgrade: function(shopId, upgradeId){
    var self = this, state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    var opt = MASRAF_OPTIONS.find(function(o){return o.id===upgradeId;});
    if(!shop || !opt) return;
    if(shop.upgrades.indexOf(upgradeId) >= 0){ toast('Bu masrafı zaten yaptın.'); return; }
    var desc = TransactionManager.shopUpgrade(player, shop, opt);
    this.perform(desc, function(){
      player.spend(desc.cost);
      shop.upgrades.push(upgradeId);
      if(upgradeId==='tadilat') shop.capacity += 1;
      else if(upgradeId==='reklam') shop.passiveBonus += 0.05;
      else if(upgradeId==='demirbas') shop.rentMult *= 0.9;
      else if(upgradeId==='sigorta') shop.satisfactionGuard = true;
      else if(upgradeId==='egitim') shop.saleBonus = (shop.saleBonus||1) * 1.06;
      self.addLog(shop.title + ' için masraf yapıldı: ' + opt.name + ' — ' + fmt(desc.cost), 'neg');
      toast(opt.name + ' tamamlandı.');
      self.render();
    });
  },

  findTenantCandidate: function(shopId){
    var state = this.state;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    if(!shop) return;
    var businesses = shop.accepts==='araba' ? TENANT_BUSINESS_ARABA : TENANT_BUSINESS_ARSA;
    shop.tenantCandidate = {
      name: pick(TENANT_NAMES), business: pick(businesses),
      offeredRent: Math.round(shop.rent * (1.1 + Math.random()*0.4))
    };
    this.render();
  },

  doAcceptTenant: function(shopId){
    var self = this, state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    if(!shop || !shop.tenantCandidate) return;
    var desc = TransactionManager.acceptTenant(player, shop);
    this.perform(desc, function(){
      shop.slots.forEach(function(itemId){
        var item = self.findInv(itemId);
        if(item) item.shopId = null;
      });
      shop.slots = [];
      shop.tenant = {
        name: shop.tenantCandidate.name, business: shop.tenantCandidate.business,
        rent: shop.tenantCandidate.offeredRent, satisfaction: 70, pendingRequest: null
      };
      shop.mode = 'kiraci';
      shop.tenantCandidate = null;
      self.addLog(shop.title + ' kiraya verildi: ' + shop.tenant.name + ' (' + shop.tenant.business + '), aylık ' + fmt(shop.tenant.rent), 'pos');
      toast('Kiracı taşındı.');
      self.render();
    });
  },

  rejectTenantCandidate: function(shopId){
    var shop = this.state.shops.find(function(s){return s.id===shopId;});
    if(!shop) return;
    shop.tenantCandidate = null;
    this.render();
  },

  doEvictTenant: function(shopId){
    var self = this, state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    if(!shop || !shop.tenant) return;
    var desc = TransactionManager.evictTenant(player, shop);
    this.perform(desc, function(){
      self.addLog(shop.title + ' kiracısı tahliye edildi: ' + shop.tenant.name, 'neg');
      shop.tenant = null;
      shop.mode = 'kendim';
      self.render();
    });
  },

  resolveTenantRequest: function(shopId, accept){
    var state = this.state, player = this.player;
    var shop = state.shops.find(function(s){return s.id===shopId;});
    if(!shop || !shop.tenant || !shop.tenant.pendingRequest) return;
    var req = shop.tenant.pendingRequest;
    if(accept) req.onAccept(shop, player); else req.onReject(shop, player);
    this.addLog(shop.title + ' kiracı talebi ' + (accept?'kabul edildi':'reddedildi') + ': ' + req.text, accept?'neg':'');
    shop.tenant.pendingRequest = null;
    this.render();
  },

  doNextDay: function(){
    var self = this, state = this.state, player = this.player;
    var desc = TransactionManager.nextDay(player);
    this.perform(desc, function(){
      state.day += 1;
      state.listings = Market.refreshListings();
      state.partsMarket = Market.refreshPartsMarket();

      var iLvl = player.skillLevel('isletme');
      var rentDiscount = clamp(iLvl*0.02, 0, 0.25);
      var passiveChance = clamp(0.35 + iLvl*0.015, 0.35, 0.6);
      state.shops.forEach(function(shop){
        var rentDue = Math.round(shop.rent * shop.rentMult * (1-rentDiscount));
        player.spend(rentDue);
        self.addLog(shop.title + ' kirası ödendi: ' + fmt(rentDue), 'neg');
        player.addXp('isletme', 4);

        if(shop.mode==='kendim'){
          shop.slots.slice().forEach(function(itemId){
            if(Math.random() < (passiveChance + shop.passiveBonus)){
              self.passiveShopSell(shop.id, itemId);
            }
          });
        } else if(shop.mode==='kiraci' && shop.tenant){
          var t = shop.tenant;
          var paysChance = clamp(t.satisfaction/100, 0.5, 0.98);
          if(Math.random() < paysChance){
            player.earn(t.rent);
            self.addLog(t.name + ' kirasını ödedi: ' + fmt(t.rent), 'pos');
          } else {
            self.addLog(t.name + ' bu ay kira ödemedi.', 'neg');
            var sabirLvl = player.skillLevel('sabir');
            var penalty = (shop.satisfactionGuard ? 2 : 5) - clamp(Math.floor(sabirLvl/3), 0, 3);
            t.satisfaction = clamp(t.satisfaction - Math.max(1, penalty), 0, 100);
            player.addXp('sabir', 5);
          }
          if(!t.pendingRequest && Math.random() < 0.20){
            t.pendingRequest = pick(TENANT_REQUESTS);
          }
          if(t.satisfaction < 20 && Math.random() < 0.4){
            self.addLog(t.name + ' sözleşmeyi feshetti ve çıktı: ' + shop.title, 'neg');
            shop.tenant = null;
            shop.mode = 'kendim';
          }
        }
      });

      // ---- Garajda satışa çıkarılmış ürünler için alıcı simülasyonu ----
      // Anında satılmaz: her gün şansa göre bir alıcı ilgilenir, ya direkt
      // fiyata razı olur ya da indirim istemek için mesaj atar.
      var pLvl = player.skillLevel('pazarlik');
      state.inventory.filter(function(i){ return i.forSale && !i.shopId && !i.pendingOffer; }).forEach(function(item){
        item.daysListed = (item.daysListed||0) + 1;
        var value = item.currentValue();
        var priceRatio = item.listedPrice / Math.max(1,value);
        var overpricePenalty = clamp((priceRatio-1)*0.6, 0, 0.3);
        var attractChance = clamp(0.32 + pLvl*0.015 - overpricePenalty, 0.08, 0.7);
        if(Math.random() < attractChance){
          var buyerName = pick(BUYER_NAMES);
          if(Math.random() < 0.45){
            // Doğrudan fiyata razı oluyor
            var salePrice = Math.round(item.listedPrice * (0.98 + Math.random()*0.05));
            item.forSale = false;
            self.completeInventorySale(item, salePrice, buyerName + ' hemen aldı');
            toast(buyerName + ' ' + item.title + ' için geldi ve aldı!');
          } else {
            // İndirim istiyor — mesaj olarak düşer, kabul/reddet gerekir
            var offerPrice = Math.round(item.listedPrice * (0.78 + Math.random()*0.14));
            item.pendingOffer = { buyerName: buyerName, offerPrice: offerPrice };
            var line = pick(BUYER_DISCOUNT_LINES).replace('{offer}', fmt(offerPrice));
            item.messages.push({ from:'seller', text: buyerName + ': "Merhaba, ' + line + '."' });
            self.addLog(buyerName + ' indirim istedi: ' + item.title + ' için ' + fmt(offerPrice), '');
            toast(buyerName + ' senden indirim istiyor — Mesajlar sekmesine bak.');
          }
        }
      });

      if(player.balance < 0) self.addLog('Kasan eksiye düştü, dikkat!', 'neg');
      self.addLog('— Gün ' + state.day + ' başladı, yeni ilanlar geldi —');
      self.render();
    });
  }
};

export var TENANT_REQUESTS = [
  { text:"Kira çok yüksek, biraz indirim rica ediyorum.",
    onAccept:function(shop){ shop.tenant.rent = Math.round(shop.tenant.rent*0.9); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+15,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-10,0,100); } },
  { text:"Tesisatta arıza var, tamiri için 3.000 ₺ rica ediyorum.", cost:3000,
    onAccept:function(shop, player){ player.spend(3000); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+10,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-15,0,100); } },
  { text:"Sözleşmeyi uzatmak istiyorum, her şey yolunda, teşekkürler.",
    onAccept:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+5,0,100); },
    onReject:function(shop){} },
  { text:"Vitrin camını yeniletmek istiyorum, 2.500 ₺ masraf çıkar.", cost:2500,
    onAccept:function(shop, player){ player.spend(2500); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+8,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-8,0,100); } },
  { text:"İşler iyi gidiyor, ek bir ay kira avans ödemek istiyorum.",
    onAccept:function(shop, player){ player.earn(shop.tenant.rent); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+6,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-4,0,100); } }
];
