import { clamp, fmt } from '../utils.js';
import {
  SKILL_XP_PER_LEVEL, CONSTRUCTION_COST_PER_M2,
  INSPECT_MISS_CHANCE, EKSPERTIZ_BASE_COST, TRAMER_COST, TRAMER_MISS_CHANCE,
  BOOST_COST, BOOST_DAYS, KASKO_DAILY_RATE, KASKO_MIN_DAILY,
  TRAVEL_CAR_COST_PER_UNIT, TRAVEL_CAR_MIN_COST, TRAVEL_CAR_HOURS_PER_UNIT,
  TRAVEL_BUS_COST_PER_UNIT, TRAVEL_BUS_MIN_COST, TRAVEL_BUS_HOURS_PER_UNIT
} from '../data/constants.js';

// =====================================================================
//  İŞLEM YÖNETİCİSİ — tüm ücret / süre / risk hesapları burada
// =====================================================================
// Her işlem tipi için tek yerden: maliyet, oyun-içi süre (saat), o sürenin
// karşılığı olan GERÇEK bekleme süresi (ms), başarı riski ve onay
// modalinde gösterilecek metinler üretir. Oyun-içi süre en fazla birkaç
// saate kadar çıkar; gerçek bekleme de buna orantılıdır.
export var TransactionManager = {

  skillLevel: function(xp){ return clamp(1 + Math.floor(xp/SKILL_XP_PER_LEVEL), 1, 10); },

  // oyun-içi saat -> gerçekten beklenecek milisaniye. 1 saat ≈ 6 sn,
  // en uzun işlemler (5-6 saat) yaklaşık 30-38 sn gerçek bekleme tutar.
  hoursToRealMs: function(hours){ return clamp(Math.round(hours*6000), 3000, 45000); },
  hoursLabel: function(hours){
    if(hours < 1) return '≈ ' + Math.round(hours*60) + ' dakika';
    if(hours <= 1) return '≈ 1 saat';
    return '≈ ' + (Math.round(hours*10)/10) + ' saat';
  },

  // --- Ekspertiz (kapsamlı yerinde inceleme — pahalı, nadiren bir şey kaçırır) ---
  inspection: function(player, item){
    var lvl = this.skillLevel(player.skills.ekspertiz);
    var discount = clamp(lvl*0.03, 0, 0.4);
    var cost = Math.round(EKSPERTIZ_BASE_COST*(1-discount));
    var hours = 1;
    var missChance = clamp(INSPECT_MISS_CHANCE - lvl*0.01, 0.03, INSPECT_MISS_CHANCE);
    return {
      type:'INSPECT',
      title:'Ekspertiz Yaptır',
      message: item.title + ' için yerinde bağımsız ekspertiz raporu istiyorsun (motor, boya, değişen).',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Yerinde inceleme — her arızayı bulma ihtimali %' + Math.round((1-missChance)*100) + '. Ağır hasar/kaza kaydı için ayrıca TRAMER sorgulanmalı.',
      confirmLabel:'Ekspertize Gönder',
      missChance: missChance,
      phases:['Randevu alınıyor…','Araç/arsa yerinde inceleniyor…','Rapor yazılıyor…']
    };
  },

  // --- TRAMER Kaydı Sorgula (SBM üzerinden ucuz/hızlı resmi kaza kaydı) ---
  tramerQuery: function(player, item){
    var lvl = this.skillLevel(player.skills.ekspertiz);
    var discount = clamp(lvl*0.03, 0, 0.4);
    var cost = Math.round(TRAMER_COST*(1-discount));
    var hours = 0.4;
    return {
      type:'TRAMER_QUERY',
      title:'TRAMER Kaydı Sorgula',
      message: item.title + ' için SBM üzerinden resmi TRAMER kaza kaydı sorgulanacak.',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Ucuz ve hızlı ama her kaza sigortaya bildirilmemiş olabilir — TRAMER kaydında bazı kazalar görünmeyebilir (~%' + Math.round(TRAMER_MISS_CHANCE*100) + ').',
      confirmLabel:'SBM Sorgusu Yap',
      phases:['SBM sistemine bağlanılıyor…','Şasi/plaka sorgulanıyor…','Sonuç SMS ile geliyor…']
    };
  },

  // --- İlan Doping (Öne Çıkar) ---
  boostListing: function(player, item){
    var hours = 0.5;
    return {
      type:'BOOST_LISTING',
      title:'İlanı Öne Çıkar',
      message: item.title + ' ilanı ' + BOOST_DAYS + ' gün boyunca öne çıkarılacak, alıcı ilgisi artacak.',
      cost: BOOST_COST,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Risksiz — ' + BOOST_DAYS + ' gün boyunca alıcı bulma şansını artırır.',
      confirmLabel:'Öne Çıkar',
      phases:['Ödeme alınıyor…','İlan vitrine taşınıyor…']
    };
  },

  // --- Kasko Sigortası bağlat/iptal (ücretsiz işlem, anında) ---
  toggleKasko: function(player, item){
    return {
      type:'TOGGLE_KASKO',
      title: item.insured ? 'Kaskoyu İptal Et' : 'Kasko Yaptır',
      message: item.insured
        ? item.title + ' üzerindeki kasko sigortası iptal edilecek.'
        : item.title + ' için kasko sigortası başlatılacak, günlük küçük bir prim kesilecek.',
      cost: 0,
      durationMs: 1500,
      durationLabel:'anında',
      riskLabel: item.insured ? 'İptal sonrası kaza/kazık riskine karşı korumasız kalırsın.' : 'Kaza ya da gizli arıza çıkarsa zararın büyük kısmını karşılar.',
      confirmLabel: item.insured ? 'İptal Et' : 'Kasko Yaptır',
      skipConfirm:false,
      phases:['İşleniyor…']
    };
  },

  // --- Satın alma ---
  purchase: function(player, item){
    var isDukkan = item.category==='dukkan';
    var hours = isDukkan ? 2 : 1.5;
    return {
      type:'BUY',
      title: isDukkan ? 'Devren Satın Al' : 'Satın Al',
      message: item.title + ' için satış sözleşmesi imzalanacak.',
      cost: item.askingPrice,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: isDukkan ? (this.hoursLabel(hours) + ' (devir işlemleri)') : (this.hoursLabel(hours) + ' (noter/sözleşme)'),
      riskLabel:'Risksiz — fiyat üzerinde anlaşıldı.',
      confirmLabel:'Satın Al, Öde',
      phases: isDukkan
        ? ['Devir sözleşmesi hazırlanıyor…','Vergi dairesi işlemleri yürütülüyor…','Anahtar teslimi yapılıyor…']
        : ['Sözleşme hazırlanıyor…','Ödeme bankaya iletiliyor…','Tapu/ruhsat devri yapılıyor…']
    };
  },

  // --- Dükkan kiralama ---
  rentShop: function(player, shop){
    var hours = 1;
    return {
      type:'RENT_SHOP', title:'Dükkan Kirala',
      message: shop.title + ' için kira sözleşmesi yapılacak. İlk aylık kira peşin ödenecek.',
      cost: Math.round(shop.rent * shop.rentMult),
      durationMs: this.hoursToRealMs(hours), durationLabel:this.hoursLabel(hours) + ' (kira sözleşmesi)',
      riskLabel:'Kiralanan dükkanın mülkiyeti sende değildir; aylık kira ödemesi devam eder.',
      confirmLabel:'Kirala', phases:['Kira sözleşmesi hazırlanıyor…','Depozito/kira işleniyor…','Anahtar teslim ediliyor…']
    };
  },

  // --- Garajdan / vitrinden satış ---
  sale: function(player, item, viaShop){
    var lvl = this.skillLevel(player.skills[viaShop?'isletme':'pazarlik']);
    var value = item.currentValue();
    var negotiation = viaShop
      ? (0.97 + 0.5*(0.18 + lvl*0.01))
      : (0.9 + 0.5*(0.2 + lvl*0.01));
    var estPrice = Math.round(value*negotiation);
    var hours = viaShop ? 0.5 : 1.5;
    return {
      type: viaShop ? 'SELL_SHOP' : 'SELL',
      title: 'Satış Yap',
      message: item.title + ' için alıcı ile pazarlık kapanıyor.',
      cost: 0,
      estPrice: estPrice,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: viaShop ? this.hoursLabel(hours) : (this.hoursLabel(hours) + ' (alıcı ile görüşme)'),
      riskLabel:'Fiyat, pazarlık becerine göre ' + fmt(Math.round(value*0.9)) + ' – ' + fmt(Math.round(value*1.15)) + ' arası oluşur.',
      confirmLabel:'Satışı Onayla',
      phases:['Alıcı ile görüşülüyor…','Pazarlık yapılıyor…','El sıkışılıyor…']
    };
  },

  // --- Garaj ürününü satışa çıkar (anında satmaz, şansa bağlı alıcı bekler) ---
  listForSale: function(player, item, price){
    var hours = 0.4;
    return {
      type:'LIST_FOR_SALE',
      title:'Satışa Çıkar',
      message: item.title + ' için ' + fmt(price) + ' fiyatla ilan yayınlanacak. Anında satılmaz — alıcılar gün geçtikçe ilgilenir, bazen indirim ister.',
      cost: 0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Fiyat çok yüksekse alıcı bulmak uzayabilir.',
      confirmLabel:'İlana Çıkar',
      skipConfirm:true,
      phases:['İlan hazırlanıyor…','Fotoğraflar ekleniyor…','Yayınlandı…']
    };
  },

  // --- Bir alıcının indirim teklifini kabul et ---
  acceptOffer: function(player, item, offerPrice){
    var hours = 0.6;
    return {
      type:'ACCEPT_OFFER',
      title:'Teklifi Kabul Et',
      message: item.title + ' için ' + fmt(offerPrice) + ' teklifini kabul edip satışı tamamlayacaksın.',
      cost: 0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Risksiz — fiyat üzerinde anlaşıldı.',
      confirmLabel:'Teklifi Kabul Et',
      phases:['Alıcıya onay veriliyor…','Ödeme alınıyor…','Devir tamamlanıyor…']
    };
  },

  // --- Arsaya ev inşaatı başlat ---
  startConstruction: function(player, land, days){
    var cost = Math.round(land.m2 * CONSTRUCTION_COST_PER_M2);
    var hours = 1.5;
    return {
      type:'START_CONSTRUCTION',
      title:'Ev İnşaatı Başlat',
      message: land.title + ' üzerine ' + land.m2 + ' m² için müteahhitle inşaat sözleşmesi imzalanacak. İnşaat ' + days + ' gün sürecek.',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (sözleşme) + ' + days + ' gün inşaat',
      riskLabel:'Risksiz — inşaat süresi boyunca arsa satılamaz.',
      confirmLabel:'İnşaatı Başlat',
      phases:['Müteahhitle görüşülüyor…','Sözleşme imzalanıyor…','Şantiye kuruluyor…']
    };
  },

  // --- Usta ile tamir ---
  repair: function(player, item, fault, usta, usesPart){
    var cost = Math.round(fault.repairCost * usta.priceMult * (usesPart ? 0.6 : 1));
    var success = clamp(usta.baseSuccess - (fault.heavy ? usta.heavyPenalty : 0), 0.1, 0.99);
    var hours = usta.hours * (fault.heavy ? 1.6 : 1);
    return {
      type:'REPAIR',
      title: usta.name + ' ile Tamir',
      message: item.title + ' üzerindeki "' + fault.label + '" arızası için iş verilecek.',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Başarı ihtimali %' + Math.round(success*100) + '. Başarısız olursa ücret yine de ödenir.',
      successChance: success,
      confirmLabel:'Ustaya Ver',
      phases:['Arıza tespiti yapılıyor…','Parça söküldü…','Yeni parça monte ediliyor…','Test sürüşü yapılıyor…']
    };
  },

  // --- Kendin tamir et ---
  selfRepair: function(player, item, fault){
    var lvl = this.skillLevel(player.skills.tamir);
    var success = clamp(0.35 + lvl*0.06 - (fault.heavy ? 0.25 : 0), 0.15, 0.95);
    var hours = clamp(2.5 - lvl*0.15, 0.8, 2.5) * (fault.heavy ? 1.4 : 1);
    return {
      type:'SELF_REPAIR',
      title:'Kendin Yap',
      message: item.title + ' üzerindeki "' + fault.label + '" arızasını kendin tamir edeceksin. İşçilik bedava, sadece parça riske girer.',
      cost: 0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (deneyimine göre değişir)',
      riskLabel:'Başarı ihtimali %' + Math.round(success*100) + '. Başarısız olursan parça harcanır.',
      successChance: success,
      confirmLabel:'Kolları Sıva',
      phases:['Kaputu açtın…','Sökme işlemine başladın…','Elinden geldiğince monte ediyorsun…']
    };
  },

  // --- Parça alımı (bulunduğun şehirdeki parçacıdan, anında) ---
  buyPart: function(player, brand, marketEntry){
    var hours = 0.6;
    return {
      type:'BUY_PART',
      title:'Yedek Parça Al',
      message: brand + ' için "' + marketEntry.name + '" satın alınacak.',
      cost: marketEntry.price,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (tedarikçiden teslim)',
      riskLabel:'Risksiz — bu şehirdeki parçacıdan, elden teslim.',
      confirmLabel:'Satın Al',
      phases:['Tedarikçi aranıyor…','Parça hazırlanıyor…','Parça teslim alınıyor…']
    };
  },

  // --- Parça alımı, başka şehirden kargoyla ---
  buyPartCargo: function(player, brand, marketEntry, shippingCost, deliveryDays){
    var hours = 0.4;
    var totalCost = marketEntry.price + shippingCost;
    return {
      type:'BUY_PART_CARGO',
      title:'Yedek Parça Sipariş Et (Kargo)',
      message: brand + ' için "' + marketEntry.name + '" ' + marketEntry.city + ' şehrindeki parçacıdan kargoyla sipariş edilecek.',
      cost: totalCost,
      partPrice: marketEntry.price,
      shippingCost: shippingCost,
      deliveryDays: deliveryDays,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: 'Kargo ile ' + deliveryDays + ' gün içinde ulaşır',
      riskLabel:'Şehir dışından kargo — parça fiyatına ' + this.fmtCargo(shippingCost) + ' kargo ücreti eklendi, ' + deliveryDays + ' gün içinde elinize ulaşır.',
      confirmLabel:'Kargoyla Sipariş Ver',
      phases:['Sipariş oluşturuluyor…','Ödeme alınıyor…','Parça kargoya veriliyor…']
    };
  },
  fmtCargo: function(n){ return n.toLocaleString('tr-TR') + ' ₺'; },

  // --- Dükkan masrafı ---
  shopUpgrade: function(player, shop, opt){
    var hours = 2;
    return {
      type:'SHOP_UPGRADE',
      title: opt.name,
      message: shop.title + ' için "' + opt.name + '" masrafı yapılacak. ' + opt.desc,
      cost: opt.cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (usta çalışması)',
      riskLabel:'Risksiz — kalıcı iyileştirme.',
      confirmLabel:'Masrafı Onayla',
      phases:['Ustalar çağırıldı…','Malzeme getirtiliyor…','İşçilik tamamlanıyor…']
    };
  },

  // --- Kiracı kabul ---
  acceptTenant: function(player, shop){
    var hours = 1.5;
    return {
      type:'ACCEPT_TENANT',
      title:'Kiracıya Ver',
      message: shop.tenantCandidate.name + ' ile kira sözleşmesi imzalanacak. Vitrindeki mevcut ürünler geri garaja alınır.',
      cost: 0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (sözleşme)',
      riskLabel:'Kiracı memnuniyeti düşerse kira ödemeyebilir ya da çıkabilir.',
      confirmLabel:'Sözleşmeyi İmzala',
      phases:['Kira sözleşmesi yazılıyor…','Noterde imzalanıyor…','Anahtar teslim ediliyor…']
    };
  },

  // --- Kiracı tahliye ---
  evictTenant: function(player, shop){
    var hours = 1;
    return {
      type:'EVICT_TENANT',
      title:'Kiracıyı Tahliye Et',
      message: shop.tenant.name + ' isimli kiracın tahliye edilecek. Bu işlem geri alınamaz.',
      cost: 0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      phases:['İhtarname gönderiliyor…','Eşyalar taşınıyor…','Anahtar teslim alınıyor…'],
      riskLabel:'Geri dönüşü yoktur.',
      confirmLabel:'Tahliye Et',
      danger:true
    };
  },

  // --- Şehirler arası seyahat (Harita ekranı) — Araba ya da Otobüs modu ---
  // mode: 'car' (seyahat aracınla — hızlı, masraflı, km ekler) ya da
  // 'bus' (herkese açık otobüs — ucuz, daha yavaş, hiçbir aracın km'sini
  // etkilemez). Çağıran taraf (Game.doTravel) 'car' için travelCarId'nin
  // seçili olduğunu önceden kontrol etmelidir.
  travel: function(player, fromCity, toCity, distance, mode){
    var isCar = mode === 'car';
    var costPerUnit = isCar ? TRAVEL_CAR_COST_PER_UNIT : TRAVEL_BUS_COST_PER_UNIT;
    var minCost = isCar ? TRAVEL_CAR_MIN_COST : TRAVEL_BUS_MIN_COST;
    var hoursPerUnit = isCar ? TRAVEL_CAR_HOURS_PER_UNIT : TRAVEL_BUS_HOURS_PER_UNIT;
    var cost = Math.max(minCost, Math.round(distance * costPerUnit));
    var hours = Math.max(isCar ? 0.3 : 0.6, distance * hoursPerUnit);
    return {
      type:'TRAVEL',
      mode: isCar ? 'car' : 'bus',
      title: isCar ? 'Arabayla Şehre Git' : 'Otobüsle Şehre Git',
      message: fromCity + ' şehrinden ' + toCity + ' şehrine ' + (isCar ? 'kendi seyahat aracınla' : 'otobüsle') + ' yolculuk yapılacak.',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel: isCar
        ? 'Daha hızlı ama daha masraflı — seyahat aracının km\'si bu yolculukla artar.'
        : 'Daha ucuz ama daha yavaş — hiçbir aracının km\'si etkilenmez.',
      confirmLabel: isCar ? 'Arabayla Yola Çık' : 'Otobüse Bin',
      phases: isCar
        ? ['Araç hazırlanıyor…','Yolda…',toCity + '\'e varıldı…']
        : ['Otobüs bileti alınıyor…','Yolda…',toCity + '\'e varıldı…']
    };
  },

  nextDay: function(player){
    var hours = 0.8;
    return {
      type:'NEXT_DAY',
      title:'Sonraki Güne Geç',
      message:'Gün kapanacak: kiralar tahsil edilir/ödenir, vitrindeki ürünler için müşteri denemesi yapılır ve yeni ilanlar gelir.',
      cost:0,
      durationMs: this.hoursToRealMs(hours),
      durationLabel:'≈ 1 gece',
      riskLabel:'',
      confirmLabel:'Günü Kapat',
      skipConfirm:true,
      phases:['Gün kapanıyor…','Kiralar hesaplanıyor…','Yeni ilanlar toplanıyor…']
    };
  }
};
