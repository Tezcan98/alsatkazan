import { rnd, pick, clamp, fmt, toast } from '../utils.js';
import { Player } from '../models/Player.js';
import { Market } from '../services/Market.js';
import { TransactionManager } from '../services/TransactionManager.js';
import { OperationManager } from '../services/OperationManager.js';
import { ConfirmDialog } from '../services/ConfirmDialog.js';
import { BilancoDialog } from '../services/BilancoDialog.js';
import {
  CAR_QUESTIONS, ARSA_QUESTIONS, USTALAR, MASRAF_OPTIONS,
  TENANT_NAMES, TENANT_BUSINESS_ARABA, TENANT_BUSINESS_ARSA,
  BUYER_NAMES, BUYER_DISCOUNT_LINES,
  CONSTRUCTION_COST_PER_M2, CONSTRUCTION_DAYS_MIN, CONSTRUCTION_DAYS_MAX, CONSTRUCTION_VALUE_MULT,
  CAR_DAILY_HOLDING_COST, ARSA_DAILY_HOLDING_COST, STALE_LISTING_DAYS, STALE_DEPRECIATION_RATE,
  BOOST_DAYS, BOOST_ATTRACT_BONUS, KASKO_DAILY_RATE, KASKO_MIN_DAILY, KASKO_DEDUCTIBLE, KAZA_DAILY_CHANCE,
  FAULT_POOL_CAR, REPUTATION_MAX_STARS, TRAMER_MISS_CHANCE, TRAMER_KAZA_TYPES,
  CITY_COORDS, TRAVEL_KM_PER_UNIT,
  CARGO_COST_PER_UNIT, CARGO_MIN_COST, CARGO_DELIVERY_DAYS_MIN, CARGO_DELIVERY_DAYS_MAX,
  DAILY_LIVING_COST, DAILY_RENT, PANSIYON_DAILY_COST, AMBIENT_EVENTS
} from '../data/constants.js';
import { ACHIEVEMENTS } from './achievements.js';
import { generateSellerReply } from '../services/SellerReplyService.js';

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
    // Başka şehirden kargoyla sipariş edilmiş ama henüz ulaşmamış parçalar
    // (bkz. Game.doBuyPart / doNextDay) — {brand, tag, name, city, arrivalDay}
    pendingParts: [],
    log: [],
    tab: "listings",
    listingFilter: "hepsi",
    listingSort: "varsayilan",
    priceMin: "",
    priceMax: "",
    searchText: "",
    cityFilter: "hepsi",
    openDetailId: null,
    openShopId: null,
    openMessageThreadItemId: null,
    // TRAMER/SBM sonuçları artık ilan sohbetinden ayrı, tek bir global
    // SBM konuşması içinde birikir (bkz. doTramerQuery / MesajlarView).
    sbmMessages: [],
    sbmThreadOpen: false,
    controlPanelOpen: false,
    // Harita: seçili şehrin ilanlarını haritanın altında listelemek için
    // (bkz. MapView) — bir şehirdeki ilan işaretine tıklanınca dolar.
    mapSelectedCity: null,
    // Harita: seyahat için seçilmiş hedef şehir — dolduğunda MapView Araba/
    // Otobüs mod seçim panelini gösterir (bkz. MapView.renderTravelPanel).
    travelTargetCity: null,
    // İlanlar sekmesindeki Liste/Harita görünüm anahtarı (bkz. ListingsView).
    listingViewMode: 'list',
    marketEvent: null
  },
  player: new Player(),
  render: function(){ /* main.js tarafından değiştirilir */ },
  _boughtDealCount: 0,
  _kaskoCount: 0,
  _boostCount: 0,
  _fullInspectCount: 0,
  _tramerCaughtCount: 0,
  _msgSeq: 0,
  stampMsg: function(m){ m.ts = ++this._msgSeq; return m; },

  // ---- Meta oyun: günlük görevler + piyasa olayı ----
  ensureDailyTasks: function(){
    var p=this.player, d=this.state.day;
    if(p.dailyTaskDay===d && p.dailyTasks && p.dailyTasks.length) return;
    var pool=[
      {id:'sale',type:'sales',title:'Sahaya Çık',desc:'Bugün 1 satış tamamla',target:1,reward:12000,xp:90},
      {id:'profit',type:'profit',title:'Kârlı İş',desc:'Bugün toplam 75.000 TL kâr yap',target:75000,reward:18000,xp:120},
      {id:'inspect',type:'inspect',title:'Detaycı Simsar',desc:'Bugün 2 ekspertiz/TRAMER işlemi yap',target:2,reward:9000,xp:70},
      {id:'repair',type:'repair',title:'Usta İş',desc:'Bugün 1 başarılı tamir tamamla',target:1,reward:10000,xp:80},
      {id:'travel',type:'travel',title:'Piyasayı Geziyorum',desc:'Bugün 1 şehir değiştir',target:1,reward:8000,xp:65}
    ];
    var a=pool[(d*3)%pool.length], b=pool[(d*3+1)%pool.length], e=pool[(d*3+3)%pool.length];
    p.dailyTasks=[a,b,e].map(function(t){return {id:t.id,type:t.type,title:t.title,desc:t.desc,target:t.target,progress:0,reward:t.reward,xp:t.xp,done:false};});
    p.dailyTaskDay=d;
  },
  progressTask: function(type, amount){
    var p=this.player; this.ensureDailyTasks();
    p.dailyTasks.forEach(function(t){
      if(t.done || t.type!==type) return;
      t.progress=Math.min(t.target,t.progress+(amount||1));
      if(t.progress>=t.target){
        t.done=true;
        p.earn(t.reward);
        p.addMetaXp(t.xp);
        toast('Görev tamamlandı: '+t.title+' +'+fmt(t.reward));
        Game.addLog('Günlük görev tamamlandı: '+t.title+' — '+fmt(t.reward), 'pos');
      }
    });
  },
  score: function(){
    var p=this.player;
    var assets=this.state.inventory.reduce(function(sum,i){return sum+(i.currentValue?Math.max(0,i.currentValue()):0);},0);
    return Math.max(0,Math.round(
      p.totalProfit/1000 + p.totalSales*850 +
      Object.keys(p.skills).reduce(function(s,k){return s+p.skillLevel(k)*250;},0) +
      p.achievements.length*1200 + assets/100000 + p.xp*4 + p.bestDealStreak*300
    ));
  },
  eventForDay: function(day){
    var defs=[
      {title:'Dizel Talebi',desc:'Dizel araçlarda alıcı ilgisi arttı.',category:'araba',salesBonus:.12},
      {title:'Arsa Hareketlendi',desc:'Arsa piyasasında alıcı trafiği yükseldi.',category:'arsa',salesBonus:.12},
      {title:'Piyasa Durgun',desc:'Alıcılar daha seçici; satış ilgisi biraz düştü.',category:'all',salesBonus:-.08},
      {title:'Nakit Piyasası',desc:'Nakit alıcılar piyasada. Hızlı satış ihtimali arttı.',category:'all',salesBonus:.06},
      {title:'Galeriler Yoğun',desc:'Galeriler stok arıyor; araç satışları hızlandı.',category:'araba',salesBonus:.10},
      {title:'Yatırımcı Günü',desc:'Yatırımcılar arsa ve dükkân bakıyor.',category:'arsa',salesBonus:.09}
    ];
    return defs[(day-1)%defs.length];
  },

  // Gün-sonu bilançosu için tek-günlük gelir/gider defteri — her
  // doNextDay() çağrısının başında sıfırlanır, o gün içindeki OTOMATİK
  // (manuel olmayan) gün-geçişi kalemleriyle doldurulur, gün sonunda
  // BilancoDialog'a geçirilir (bkz. doNextDay, ledgerExpense/ledgerIncome).
  _dayLedger: null,
  ledgerExpense: function(label, amount){
    if(!amount || !this._dayLedger) return;
    this._dayLedger.expense[label] = (this._dayLedger.expense[label]||0) + amount;
  },
  ledgerIncome: function(label, amount){
    if(!amount || !this._dayLedger) return;
    this._dayLedger.income[label] = (this._dayLedger.income[label]||0) + amount;
  },

  init: function(){
    ConfirmDialog.init();
    BilancoDialog.init();
    OperationManager.init();
    this.state.listings = Market.refreshListings();
    this.state.listings.forEach(function(l){ l.createdDay = 1; });
    this.state.partsMarket = Market.refreshPartsMarket();
    this.state.marketEvent = this.eventForDay(this.state.day);
    this.ensureDailyTasks();
    this.addLog('Simsarlığa hoş geldin. Kasanla ilan al, incele, tamir ettir, kârına sat.');
  },

  addLog: function(msg, cls){
    this.state.log.unshift({msg:msg, cls:cls||""});
    if(this.state.log.length>50) this.state.log.pop();
  },

  // sahibinden'deki satıcı puanı gibi: satış geçmişine göre 1-5 yıldız.
  // Alıcı ilgisini ve pazarlığı hafifçe etkiler (bkz. doNextDay).
  reputationStars: function(){
    var p = this.player;
    var base = 3 + Math.min(1.5, p.totalSales*0.12) + (p.totalProfit>0 ? 0.5 : p.totalProfit<0 ? -0.5 : 0);
    return clamp(Math.round(base*2)/2, 1, REPUTATION_MAX_STARS);
  },

  // Her önemli eylemden sonra çağrılır: henüz açılmamış ve şartı
  // sağlanan başarımları açar, loglar ve toast gösterir.
  checkAchievements: function(){
    var self = this;
    ACHIEVEMENTS.forEach(function(a){
      if(self.player.achievements.indexOf(a.id) >= 0) return;
      if(a.test(self)){
        self.player.achievements.push(a.id);
        self.addLog('Başarım açıldı: ' + a.title + ' — ' + a.desc, 'pos');
        toast('Başarım açıldı: ' + a.title);
      }
    });
  },

  findListing: function(id){ return this.state.listings.find(function(l){return l.id===id;}); },
  findInv: function(id){ return this.state.inventory.find(function(l){return l.id===id;}); },
  findAny: function(id){ return this.findListing(id) || this.findInv(id); },

  toggleFavorite: function(id){
    var item = this.findAny(id);
    if(!item) return;
    item.favorite = !item.favorite;
    toast(item.favorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.');
    this.render();
  },

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
  // Ekspertiz: yerinde inceleme — motor/boya/diğer (hasar/heavy olmayan)
  // arızaları açar, INSPECT_MISS_CHANCE ile bazen birini kaçırır.
  doInspect: function(id){
    var self = this, player = this.player;
    var item = this.findAny(id);
    if(!item || item.ekspertizDone) return;
    var desc = TransactionManager.inspection(player, item);
    this.perform(desc, function(){
      player.spend(desc.cost);
      item.ekspertizDone = true;
      item.inspected = true;
      var lightFaults = item.faults.filter(function(f){ return !f.heavy; });
      lightFaults.forEach(function(f){ f.hidden = Math.random() < desc.missChance; });
      var missedCount = lightFaults.filter(function(f){return f.hidden;}).length;
      self.addLog('Ekspertiz yaptırıldı: ' + item.title + ' — ' + fmt(desc.cost), 'neg');
      if(missedCount>0) self.addLog('(Ekspertizci bir şeyi gözden kaçırmış olabilir — satın almadan emin olamazsın.)', '');
      player.addXp('ekspertiz', 25);
      self.progressTask('inspect',1);
      player.addMetaXp(12);
      self.checkAchievements();
      self.render();
    });
  },

  // Ekspertiz ile satıcının önceki beyanı çelişiyorsa pazarlık açılır.
  // Oyuncu daha önce hazır sorulardan birini sormuş olmalı; aksi halde
  // "adamın dediğinden farklı" karşılaştırması yapılamaz.
  expertDiscrepancy: function(item){
    if(!item || !item.ekspertizDone || !item.sellerClaims) return [];
    return Object.keys(item.sellerClaims).filter(function(key){
      var claim = item.sellerClaims[key];
      if(claim !== true) return false;
      if(key==='fiyat') return false;
      return item.faults.some(function(f){
        return f.tag===key && !f.hidden;
      });
    });
  },

  negotiateExpertDiscrepancy: function(id){
    var self=this, player=this.player, item=this.findListing(id);
    if(!item || item.owned || !item.ekspertizDone || item.negotiationDone) return;
    var mismatches=this.expertDiscrepancy(item);
    if(!mismatches.length){ toast('Ekspertiz ile satıcının beyanı arasında kayıtlı bir fark yok.'); return; }

    var totalLoss=mismatches.reduce(function(sum,key){
      return sum + item.faults.filter(function(f){return f.tag===key && !f.hidden;})
        .reduce(function(s,f){return s+f.loss;},0);
    },0);
    var skill=player.skillLevel('pazarlik');
    var sellerPressure=item.sellerHonesty < 0.45 ? 1.15 : 0.9;
    var discount=clamp(0.04 + skill*0.012 + Math.min(0.10,totalLoss/2000000)*sellerPressure,0.04,0.20);
    var reduction=Math.max(2500,Math.round(item.askingPrice*discount/500)*500);
    var oldPrice=item.askingPrice;
    item.askingPrice=Math.max(500,item.askingPrice-reduction);
    item.negotiationDone=true;
    item.messages.push(self.stampMsg({from:'me',text:'Ekspertizde ilan beyanınızla uyuşmayan durumlar çıktı. '+fmt(reduction)+' TL aşağıdan, '+fmt(item.askingPrice)+' TL teklif ediyorum.'}));
    item.messages.push(self.stampMsg({from:'seller',text:'Ekspertiz raporunu gördüm. '+fmt(reduction)+' TL indirimle '+fmt(item.askingPrice)+' TL son fiyatım olsun.'}));
    player.addXp('pazarlik',18);
    player.addMetaXp(10);
    self.addLog('Ekspertiz farkı üzerinden pazarlık edildi: '+item.title+' — '+fmt(oldPrice)+' → '+fmt(item.askingPrice), 'pos');
    toast('Ekspertiz farkı pazarlığa yansıdı: -'+fmt(reduction));
    self.render();
  },

  // TRAMER: SBM üzerinden resmi kaza kaydı sorgusu — sadece araba, sadece
  // ağır hasar (heavy) kayıtlarını açar, TRAMER_MISS_CHANCE ile bazı
  // kazalar sigortaya bildirilmemiş olabileceğinden görünmeyebilir.
  // Sonuç, SBM'den gelen bir SMS gibi Mesajlar'a düşer.
  doTramerQuery: function(id){
    var self = this, player = this.player;
    var item = this.findAny(id);
    if(!item || item.category!=='araba' || item.tramerDone) return;
    var desc = TransactionManager.tramerQuery(player, item);
    this.perform(desc, function(){
      player.spend(desc.cost);
      item.tramerDone = true;
      item.inspected = true;
      var heavyFaults = item.faults.filter(function(f){ return f.heavy; });
      var found = [];
      heavyFaults.forEach(function(f){
        var missed = Math.random() < TRAMER_MISS_CHANCE;
        f.hidden = missed;
        if(!missed) found.push(f);
      });

      var plate = item.plate || self.randomPlateFallback();
      var chassisSuffix = item.chassisSuffix || '0000';
      // TRAMER/SBM sonuçları artık ilan sohbetiyle karışmıyor — kendi
      // global SBM konuşmasına (state.sbmMessages) düşüyor.
      self.state.sbmMessages.push(self.stampMsg({
        itemId: item.id, itemTitle: item.title, plate: plate, from:'me',
        text: plate + ' plaka / ***' + chassisSuffix + ' şasi no için TRAMER kaydı sorgula.'
      }));

      var reportText;
      if(found.length===0){
        reportText = 'Kayıtlarımıza göre bu araç kayıtlı bir kazaya karışmamıştır.';
      } else {
        var lines = found.map(function(f, i){
          var kt = pick(TRAMER_KAZA_TYPES);
          var cost = rnd(200, 900) * 5;
          return 'KZ' + (i+1) + ': ' + self.randomPastDateStr() + ' ' + kt.code + '-' + kt.reason + ' ' + cost + 'TL';
        });
        reportText = 'Kayıtlarımıza göre ***' + chassisSuffix + ' Şasi no\'lu araç ' + found.length + ' adet kazaya karışmıştır.\n' + lines.join('\n');
      }
      self.state.sbmMessages.push(self.stampMsg({
        itemId: item.id, itemTitle: item.title, plate: plate, from:'sbm', text: reportText
      }));

      self.addLog('TRAMER kaydı sorgulandı: ' + item.title + ' — ' + fmt(desc.cost), 'neg');
      self._fullInspectCount += 1;
      self.progressTask('inspect',1);
      player.addMetaXp(12);
      if(found.length>0) self._tramerCaughtCount += 1;
      player.addXp('ekspertiz', 20);
      self.checkAchievements();
      self.render();
    });
  },

  // ---- Harita / Seyahat ----
  cityDistance: function(fromCity, toCity){
    var a = CITY_COORDS[fromCity], b = CITY_COORDS[toCity];
    if(!a || !b) return 0;
    return Math.sqrt(Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2));
  },
  // mode: 'car' (seyahat aracınla — hızlı, masraflı, km ekler) ya da
  // 'bus' (otobüs — ucuz, yavaş, km eklemez). 'car' için önce travelCarId
  // seçili olmalı (bkz. MapView.renderTravelPanel'de disabled kontrolü).
  doTravel: function(city, mode){
    var self = this, player = this.player;
    if(!CITY_COORDS[city] || city===player.currentCity) return;
    if(mode==='car' && !player.travelCarId){ toast('Önce Garajım\'dan bir seyahat aracı seç.'); return; }
    var dist = this.cityDistance(player.currentCity, city);
    var desc = TransactionManager.travel(player, player.currentCity, city, dist, mode);
    this.perform(desc, function(){
      player.spend(desc.cost);
      var fromCity = player.currentCity;
      player.currentCity = city;
      self.state.travelTargetCity = null;
      self.progressTask('travel',1);
      player.addMetaXp(10);
      self.addLog('Seyahat edildi (' + (desc.mode==='car'?'araba':'otobüs') + '): ' + fromCity + ' → ' + city + ' — ' + fmt(desc.cost), 'neg');
      toast('Artık ' + city + ' şehrindesin.');
      // Sadece Araba modunda: seyahat aracının km'si kat edilen mesafeyle
      // artar. Otobüs modunda hiçbir aracın km'si etkilenmez.
      if(desc.mode==='car'){
        var travelCar = self.findInv(player.travelCarId);
        if(travelCar && travelCar.category==='araba'){
          var addedKm = Math.round(dist * TRAVEL_KM_PER_UNIT);
          travelCar.km += addedKm;
          self.addLog(travelCar.title + ' ile gidildi, km ' + addedKm.toLocaleString('tr-TR') + ' arttı (toplam ' + travelCar.km.toLocaleString('tr-TR') + ' km).', '');
        }
      }
      self.render();
    });
  },

  // Bir şehirdeki parçacıdan kargoyla sipariş verilince ücret/süre tahmini
  // (bkz. doBuyPart, PartsCard). Mesafeye göre hesaplanır ama otobüs
  // biletinden bile ucuz tutulur — kargonun amacı oraya gitmekten tasarruf.
  cargoEstimate: function(toCity){
    var dist = this.cityDistance(this.player.currentCity, toCity);
    var shipping = Math.max(CARGO_MIN_COST, Math.round(dist * CARGO_COST_PER_UNIT));
    var days = clamp(Math.round(dist/80) + 1, CARGO_DELIVERY_DAYS_MIN, CARGO_DELIVERY_DAYS_MAX);
    return { shipping: shipping, days: days };
  },

  // ---- Seyahat aracı seç / seçimi kaldır (bkz. GarageView) ----
  setTravelCar: function(itemId){
    var player = this.player;
    var item = itemId ? this.findInv(itemId) : null;
    if(itemId && (!item || item.category!=='araba')) return;
    player.travelCarId = (player.travelCarId === itemId) ? null : itemId;
    toast(player.travelCarId ? 'Seyahat aracın ayarlandı.' : 'Seyahat aracı kaldırıldı.');
    this.render();
  },

  randomPlateFallback: function(){ return '34 ABC ' + rnd(100,999); },
  randomPastDateStr: function(){
    var d = rnd(1,29), m = rnd(1,13), y = rnd(2011, 2025);
    function pad(n){ return n<10 ? '0'+n : ''+n; }
    return pad(d) + '/' + pad(m) + '/' + y;
  },

  doBuy: function(id){
    var self = this, state = this.state, player = this.player;
    var item = this.findListing(id);
    if(!item) return;
    // Araba ilanları artık kendi bulunduğu şehre bağlı — o şehirde
    // olmadan satın alınamaz (bkz. DetailView "Bu şehre git" düğmesi).
    if(item.category==='araba' && item.location && item.location !== player.currentCity){
      toast('Bu araç ' + item.location + ' şehrinde — önce oraya gitmelisin.');
      return;
    }
    var hiddenLoss = item.faults.filter(function(f){return f.hidden;}).reduce(function(s,f){return s+f.loss;},0);
    var desc = TransactionManager.purchase(player, item);
    this.perform(desc, function(){
      var idx = state.listings.findIndex(function(l){return l.id===id;});
      if(idx<0) return;
      state.listings.splice(idx,1);
      player.spend(desc.cost);
      item.owned = true;
      item.purchasePrice = desc.cost;
      if(item.isDeal) self._boughtDealCount += 1;
      if(item.category==='dukkan'){
        state.shops.push(item);
        self.addLog('Devren satın alındı: ' + item.title + ' — ' + fmt(item.purchasePrice), 'neg');
        toast('Dükkan alındı, Kontrol Paneli → Dükkanlarım.');
      } else {
        item.inspected = true;
        item.faults.forEach(function(f){ f.hidden = false; }); // artık sahibisin, her şeyi görürsün
        item.shopId = null;
        state.inventory.push(item);
        self.addLog('Satın alındı: ' + item.title + ' — ' + fmt(item.purchasePrice), 'neg');
        toast('Satın alındı, Garajım sekmesinde.');
        player.addXp('pazarlik', 3);
        player.addMetaXp(8);
        self.checkForKazik(item, hiddenLoss);
      }
      self.checkAchievements();
      state.openDetailId = null;
      self.render();
    });
  },

  // Ekspertiz yaptırmadan alınan ürünlerde gizli arıza çıkarsa "kazık
  // yedin" olayı tetiklenir: Sabır seviyesi yükseldikçe zararın bir kısmı
  // telafi edilir (item.trueValue'ya geri eklenir) ve Sabır XP kazanılır.
  checkForKazik: function(item, hiddenLoss){
    if(!hiddenLoss || hiddenLoss < 82500) return;
    var player = this.player;
    var sabirLvl = player.skillLevel('sabir');
    var mitigation = clamp(sabirLvl*0.03, 0, 0.3);
    var recovered = Math.round(hiddenLoss*mitigation);
    if(recovered>0) item.trueValue += recovered;
    this.addLog('Kazık yedin! ' + item.title + ' üzerinde ' + fmt(hiddenLoss) + ' değerinde gizli arıza çıktı' + (recovered>0 ? ' (Sabır sayesinde ' + fmt(recovered) + ' telafi edildi)' : '') + '.', 'neg');
    toast('Kazık yedin! Gizli arıza ortaya çıktı.');
    player.addXp('sabir', clamp(Math.round(hiddenLoss/4950), 6, 35));
  },

  askQuestion: function(id, key){
    var state = this.state;
    var item = this.findAny(id);
    if(!item) return;
    var qList = item.category==='araba' ? CAR_QUESTIONS : ARSA_QUESTIONS;
    var q = qList.find(function(x){return x.key===key;});
    if(!q) return;
    item.messages.push(this.stampMsg({from:'me', text:q.text}));

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
            item.sellerClaims[key] = false;
            reply = "Açık konuşayım, ufak bir " + (key==='hasar' ? 'kayıt' : key==='motor' ? 'sorun' : key==='boya' ? 'boya işlemi' : key==='tapu' ? 'kayıt' : key==='yol' ? 'durum' : 'husus') + " var ama fiyata yansıttım zaten.";
          } else {
            item.sellerClaims[key] = false;
            reply = "Hayır, kesinlikle öyle bir şey yok, çok temiz.";
          }
        } else {
          item.sellerClaims[key] = true;
          reply = "Hayır, gayet temiz, o konuda hiç sorun yok.";
        }
      }
    }
    item.messages.push(this.stampMsg({from:'seller', text:reply}));
    this.render();
  },

  // Oyuncunun ilan sahibine serbest metin yazdığı, hazır soru çiplerinin
  // dışındaki mesaj akışı. Hazır sorular (askQuestion) hâlâ kural tabanlı
  // bir yanıt alır; burada ise satıcı yanıtı SellerReplyService'ten gelir
  // — o servis şu an bir stub olduğundan (gelecekte Gemini bağlanacak)
  // null döner ve bilerek OTOMATİK BİR YANIT EKLENMEZ.
  sendFreeMessage: function(id, text){
    var item = this.findAny(id);
    if(!item || !text || !text.trim()) return;
    item.messages.push(this.stampMsg({from:'me', text: text.trim()}));
    var reply = generateSellerReply(text.trim(), item); // stub: her zaman null
    if(reply){ item.messages.push(this.stampMsg({from:'seller', text: reply})); }
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
        player.addMetaXp(15);
        self.progressTask('repair',1);
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
    if(item.underConstruction){ toast('İnşaat sürerken bu arsa satışa çıkarılamaz.'); return; }
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

  // ---- İlan Doping — sahibinden'in imza özelliği ----
  doBoostListing: function(id){
    var self = this, player = this.player;
    var item = this.findInv(id);
    if(!item || !item.forSale) return;
    if(item.boosted){ toast('Bu ilan zaten öne çıkarılmış.'); return; }
    var desc = TransactionManager.boostListing(player, item);
    this.perform(desc, function(){
      player.spend(desc.cost);
      item.boosted = true;
      item.boostDaysLeft = BOOST_DAYS;
      self.addLog(item.title + ' öne çıkarıldı — ' + fmt(desc.cost) + ' (' + BOOST_DAYS + ' gün)', 'neg');
      toast('İlan öne çıkarıldı!');
      self._boostCount += 1;
      self.checkAchievements();
      self.render();
    });
  },

  // ---- Kasko sigortası aç/kapat ----
  doToggleKasko: function(id){
    var self = this, player = this.player;
    var item = this.findInv(id);
    if(!item || item.category!=='araba') return;
    var desc = TransactionManager.toggleKasko(player, item);
    this.perform(desc, function(){
      item.insured = !item.insured;
      self.addLog(item.title + ' — kasko ' + (item.insured ? 'başlatıldı' : 'iptal edildi'), item.insured ? 'neg' : '');
      toast(item.insured ? 'Kasko aktif.' : 'Kasko iptal edildi.');
      if(item.insured) self._kaskoCount += 1;
      self.checkAchievements();
      self.render();
    });
  },

  // ---- Arsaya ev dikme ----
  doStartConstruction: function(id){
    var self = this, player = this.player;
    var land = this.findInv(id);
    if(!land || land.category!=='arsa') return;
    if(land.hasHouse){ toast('Bu arsada zaten ev var.'); return; }
    if(land.underConstruction){ toast('İnşaat zaten sürüyor.'); return; }
    if(land.forSale){ toast('Önce satıştan kaldırmalısın.'); return; }
    var days = rnd(CONSTRUCTION_DAYS_MIN, CONSTRUCTION_DAYS_MAX+1);
    var desc = TransactionManager.startConstruction(player, land, days);
    this.perform(desc, function(){
      player.spend(desc.cost);
      land.underConstruction = true;
      land.constructionDaysLeft = days;
      self.addLog('İnşaat başladı: ' + land.title + ' — ' + fmt(desc.cost) + ' (' + days + ' gün sürecek)', 'neg');
      toast('İnşaat başladı, ' + days + ' gün sürecek.');
      self.render();
    });
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
    if(profit>0){ player.dealStreak += 1; player.bestDealStreak=Math.max(player.bestDealStreak,player.dealStreak); }
    else { player.dealStreak = 0; }
    player.addMetaXp(Math.max(5,Math.round(Math.abs(profit)/25000)));
    this.progressTask('sales',1);
    if(profit>0) this.progressTask('profit',profit);
    if(item.category==='araba') player.carsSold += 1;
    else if(item.category==='arsa') player.arsaSold += 1;
    else if(item.category==='dukkan') player.dukkanSold += 1;
    this.checkAchievements();
  },

  // Bir alıcının indirim teklifini kabul/reddet.
  resolveBuyerOffer: function(id, accept){
    var self = this, state = this.state, player = this.player;
    var item = this.findInv(id);
    if(!item || !item.pendingOffer) return;
    var offer = item.pendingOffer;
    if(!accept){
      item.pendingOffer = null;
      item.messages.push(this.stampMsg({from:'seller', text:'Tamam, o zaman şimdilik ' + fmt(item.listedPrice) + ' fiyatta bekliyorum.'}));
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
    if(item.underConstruction){ toast('İnşaat sürerken bu arsa vitrine konamaz.'); return; }
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
      if(profit>0){ player.dealStreak += 1; player.bestDealStreak=Math.max(player.bestDealStreak,player.dealStreak); }
      else player.dealStreak=0;
      player.addMetaXp(Math.max(5,Math.round(Math.abs(profit)/25000)));
      self.progressTask('sales',1);
      if(profit>0) self.progressTask('profit',profit);
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
    if(profit>0){ player.dealStreak += 1; player.bestDealStreak=Math.max(player.bestDealStreak,player.dealStreak); }
    else player.dealStreak=0;
    player.addMetaXp(Math.max(5,Math.round(Math.abs(profit)/25000)));
    this.progressTask('sales',1);
    if(profit>0) this.progressTask('profit',profit);
    this.ledgerIncome('Vitrin satışları (pasif)', salePrice);
  },

  // city verilmezse varsayılan olarak bulunduğun şehir kabul edilir
  // (UstalarView her zaman kendi şehrini gösterdiği için city geçmez).
  // Bulunduğun şehirden alım anında teslim edilir; başka şehirden alım
  // kargoyla gelir — ücrete kargo eklenir ve birkaç gün gün-içi gecikir
  // (bkz. state.pendingParts / doNextDay).
  doBuyPart: function(brand, tag, city){
    var self = this, state = this.state, player = this.player;
    city = city || player.currentCity;
    var m = state.partsMarket.find(function(p){return p.brand===brand && p.tag===tag && p.city===city;});
    if(!m) return;
    if(city === player.currentCity){
      var desc = TransactionManager.buyPart(player, brand, m);
      this.perform(desc, function(){
        player.spend(desc.cost);
        var key = brand + '|' + tag;
        state.parts[key] = (state.parts[key]||0) + 1;
        self.addLog('Yedek parça alındı: ' + brand + ' ' + m.name + ' — ' + fmt(desc.cost), 'neg');
        self.render();
      });
    } else {
      var est = this.cargoEstimate(city);
      var cdesc = TransactionManager.buyPartCargo(player, brand, m, est.shipping, est.days);
      this.perform(cdesc, function(){
        player.spend(cdesc.cost);
        state.pendingParts.push({ brand: brand, tag: tag, name: m.name, city: city, arrivalDay: state.day + est.days });
        self.addLog('Yedek parça kargoyla sipariş edildi: ' + brand + ' ' + m.name + ' (' + city + ') — ' + fmt(cdesc.cost) + ', ' + est.days + ' gün içinde gelir', 'neg');
        toast('Sipariş verildi — ' + est.days + ' gün içinde ulaşır.');
        self.render();
      });
    }
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
      var startBalance = player.balance;
      self._dayLedger = { expense: {}, income: {} };
      state.day += 1;
      state.marketEvent = self.eventForDay(state.day);
      self.ensureDailyTasks();
      self.addLog('Piyasa olayı: '+state.marketEvent.title+' — '+state.marketEvent.desc, 'pos');
      toast(state.marketEvent.title+': '+state.marketEvent.desc);
      // Favorilenen ilanlar günlük yenilemede kaybolmasın diye korunur,
      // yeni ilan havuzunun başına eklenir.
      var keptFavorites = state.listings.filter(function(l){ return l.favorite; });
      var freshListings = Market.refreshListings();
      freshListings.forEach(function(l){ l.createdDay = state.day; });
      state.listings = keptFavorites.concat(freshListings);
      state.partsMarket = Market.refreshPartsMarket();

      // ---- Kargoyla sipariş edilmiş parçalar — süresi dolanlar ulaşır ----
      var arrived = state.pendingParts.filter(function(p){ return p.arrivalDay <= state.day; });
      if(arrived.length>0){
        arrived.forEach(function(p){
          var key = p.brand + '|' + p.tag;
          state.parts[key] = (state.parts[key]||0) + 1;
          self.addLog('Kargo ulaştı: ' + p.brand + ' ' + p.name + ' (' + p.city + '\'den)', 'pos');
        });
        toast(arrived.length + ' kargo parçası ulaştı.');
        state.pendingParts = state.pendingParts.filter(function(p){ return p.arrivalDay > state.day; });
      }

      // ---- Günlük kişisel giderler: ev kirası + yaşam maliyeti (her zaman) ----
      player.spend(DAILY_RENT);
      self.ledgerExpense('Ev Kirası', DAILY_RENT);
      self.addLog('Ev kirası ödendi: ' + fmt(DAILY_RENT), 'neg');

      player.spend(DAILY_LIVING_COST);
      self.ledgerExpense('Yaşam Maliyeti', DAILY_LIVING_COST);
      self.addLog('Günlük yaşam maliyeti: ' + fmt(DAILY_LIVING_COST), 'neg');

      // ---- Pansiyon: ne ev şehrinde ne de bir dükkanının şehrinde isen ----
      var inShopCity = state.shops.some(function(s){ return s.location===player.currentCity; });
      if(player.currentCity !== player.homeCity && !inShopCity){
        player.spend(PANSIYON_DAILY_COST);
        self.ledgerExpense('Pansiyon (şehir dışı)', PANSIYON_DAILY_COST);
        self.addLog('Şehir dışındasın (' + player.currentCity + ') — pansiyon masrafı: ' + fmt(PANSIYON_DAILY_COST), 'neg');
      }

      // ---- Arsalarda süren inşaatlar ----
      state.inventory.filter(function(i){ return i.category==='arsa' && i.underConstruction; }).forEach(function(land){
        land.constructionDaysLeft -= 1;
        if(land.constructionDaysLeft <= 0){
          land.underConstruction = false;
          land.hasHouse = true;
          var addedValue = Math.round(land.m2 * CONSTRUCTION_COST_PER_M2 * CONSTRUCTION_VALUE_MULT);
          land.trueValue += addedValue;
          land.title = land.title.replace(' Arsa', '') + ' — Üzerinde Ev Var';
          self.addLog('İnşaat tamamlandı: ' + land.title + ' — değeri ' + fmt(addedValue) + ' arttı!', 'pos');
          toast('İnşaat bitti! ' + land.title);
        }
      });

      // ---- Sahip olma masrafları: garajda bekleyen araç/arsa bedava durmaz ----
      var totalHolding = 0;
      state.inventory.forEach(function(item){
        item.daysOwned = (item.daysOwned||0) + 1;
        if(item.category==='araba'){ totalHolding += CAR_DAILY_HOLDING_COST; }
        else if(item.category==='arsa'){ totalHolding += ARSA_DAILY_HOLDING_COST; }
        // uzun süre satılamayan ürünler yavaşça değer kaybeder
        if(item.forSale && item.daysListed > STALE_LISTING_DAYS){
          item.trueValue = Math.max(1000, Math.round(item.trueValue * (1-STALE_DEPRECIATION_RATE)));
        }
        // ilan doping süresi azalır
        if(item.boosted){
          item.boostDaysLeft -= 1;
          if(item.boostDaysLeft <= 0){ item.boosted = false; self.addLog(item.title + ' için öne çıkarma süresi bitti.', ''); }
        }
      });
      if(totalHolding > 0){
        player.spend(totalHolding);
        self.ledgerExpense('Sahip olma masrafları (garaj)', totalHolding);
        self.addLog('Sigorta / vergi masrafları: ' + fmt(totalHolding) + ' (' + state.inventory.length + ' ürün için)', 'neg');
      }

      // ---- Kasko primi + kaza riski (sadece araçlar) ----
      state.inventory.filter(function(i){ return i.category==='araba'; }).forEach(function(car){
        if(car.insured){
          var premium = Math.max(KASKO_MIN_DAILY, Math.round(car.currentValue()*KASKO_DAILY_RATE));
          player.spend(premium);
          self.ledgerExpense('Kasko primleri', premium);
          self.addLog(car.title + ' kasko primi: ' + fmt(premium), 'neg');
        }
        if(Math.random() < KAZA_DAILY_CHANCE){
          var faultDef = pick(FAULT_POOL_CAR);
          var newFault = { tag:faultDef.tag, label:faultDef.label, loss:rnd(faultDef.loss[0],faultDef.loss[1]), repairCost:rnd(faultDef.repair[0],faultDef.repair[1]), fixed:false, heavy:false, hidden:false };
          if(car.insured){
            player.spend(KASKO_DEDUCTIBLE);
            self.ledgerExpense('Kaza masrafları (kasko muafiyeti)', KASKO_DEDUCTIBLE);
            newFault.fixed = true;
            car.faults.push(newFault);
            self.addLog('Kaza oldu: ' + car.title + ' — "' + newFault.label + '" ama kasko karşıladı (muafiyet ' + fmt(KASKO_DEDUCTIBLE) + ')', 'neg');
            toast('Kaza oldu ama kaskon karşıladı.');
          } else {
            car.faults.push(newFault);
            self.addLog('Kaza oldu: ' + car.title + ' — "' + newFault.label + '" — kaskon olmadığı için değer kaybı yaşandı (~' + fmt(newFault.loss) + ')', 'neg');
            toast('Kaza oldu! Kaskon yoktu, değer kaybettin.');
          }
        }
      });

      var iLvl = player.skillLevel('isletme');
      var rentDiscount = clamp(iLvl*0.02, 0, 0.25);
      var passiveChance = clamp(0.35 + iLvl*0.015, 0.35, 0.6);
      state.shops.forEach(function(shop){
        var rentDue = Math.round(shop.rent * shop.rentMult * (1-rentDiscount));
        player.spend(rentDue);
        self.ledgerExpense('Dükkan kiraları', rentDue);
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
            self.ledgerIncome('Kiracı kira geliri', t.rent);
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
      var repBonus = (self.reputationStars()-3) * 0.02; // ortalamanın üstü/altı küçük bir etki
      state.inventory.filter(function(i){ return i.forSale && !i.shopId && !i.pendingOffer; }).forEach(function(item){
        item.daysListed = (item.daysListed||0) + 1;
        var value = item.currentValue();
        var priceRatio = item.listedPrice / Math.max(1,value);
        var overpricePenalty = clamp((priceRatio-1)*0.6, 0, 0.3);
        var boostBonus = item.boosted ? BOOST_ATTRACT_BONUS : 0;
        var eventBonus = 0;
        if(self.state.marketEvent && (self.state.marketEvent.category==='all' || self.state.marketEvent.category===item.category)) eventBonus=self.state.marketEvent.salesBonus;
        var attractChance = clamp(0.32 + pLvl*0.015 - overpricePenalty + boostBonus + repBonus + eventBonus, 0.08, 0.92);
        if(Math.random() < attractChance){
          var buyerName = pick(BUYER_NAMES);
          if(Math.random() < 0.45){
            // Doğrudan fiyata razı oluyor
            var salePrice = Math.round(item.listedPrice * (0.98 + Math.random()*0.05));
            item.forSale = false;
            self.completeInventorySale(item, salePrice, buyerName + ' hemen aldı');
            self.ledgerIncome('Otomatik satışlar (garaj)', salePrice);
            toast(buyerName + ' ' + item.title + ' için geldi ve aldı!');
          } else {
            // İndirim istiyor — mesaj olarak düşer, kabul/reddet gerekir
            var offerPrice = Math.round(item.listedPrice * (0.78 + Math.random()*0.14));
            item.pendingOffer = { buyerName: buyerName, offerPrice: offerPrice };
            var line = pick(BUYER_DISCOUNT_LINES).replace('{offer}', fmt(offerPrice));
            item.messages.push(self.stampMsg({ from:'seller', text: buyerName + ': "Merhaba, ' + line + '."' }));
            self.addLog(buyerName + ' indirim istedi: ' + item.title + ' için ' + fmt(offerPrice), '');
            toast(buyerName + ' senden indirim istiyor — Mesajlar sekmesine bak.');
          }
        }
      });

      if(player.balance < 0) self.addLog('Kasan eksiye düştü, dikkat!', 'neg');
      self.addLog('— Gün ' + state.day + ' başladı, yeni ilanlar geldi —');
      self.checkAchievements();

      // ---- Gün-sonu bilançosu: o gün biriken otomatik gelir/giderler ----
      var ledger = self._dayLedger;
      self._dayLedger = null;
      var expenseRows = Object.keys(ledger.expense).map(function(k){ return {label:k, amount: ledger.expense[k]}; });
      var incomeRows = Object.keys(ledger.income).map(function(k){ return {label:k, amount: ledger.income[k]}; });
      var net = player.balance - startBalance;

      self.render();
      BilancoDialog.show({
        day: state.day,
        startBalance: startBalance,
        endBalance: player.balance,
        net: net,
        expense: expenseRows,
        income: incomeRows
      });
    });
  }
};

var TENANT_FIX_COST = 16500;
var TENANT_GLASS_COST = 13750;
export var TENANT_REQUESTS = [
  { text:"Kira çok yüksek, biraz indirim rica ediyorum.",
    onAccept:function(shop){ shop.tenant.rent = Math.round(shop.tenant.rent*0.9); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+15,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-10,0,100); } },
  { text:"Tesisatta arıza var, tamiri için " + fmt(TENANT_FIX_COST) + " rica ediyorum.", cost:TENANT_FIX_COST,
    onAccept:function(shop, player){ player.spend(TENANT_FIX_COST); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+10,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-15,0,100); } },
  { text:"Sözleşmeyi uzatmak istiyorum, her şey yolunda, teşekkürler.",
    onAccept:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+5,0,100); },
    onReject:function(shop){} },
  { text:"Vitrin camını yeniletmek istiyorum, " + fmt(TENANT_GLASS_COST) + " masraf çıkar.", cost:TENANT_GLASS_COST,
    onAccept:function(shop, player){ player.spend(TENANT_GLASS_COST); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+8,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-8,0,100); } },
  { text:"İşler iyi gidiyor, ek bir ay kira avans ödemek istiyorum.",
    onAccept:function(shop, player){ player.earn(shop.tenant.rent); shop.tenant.satisfaction = clamp(shop.tenant.satisfaction+6,0,100); },
    onReject:function(shop){ shop.tenant.satisfaction = clamp(shop.tenant.satisfaction-4,0,100); } }
];
