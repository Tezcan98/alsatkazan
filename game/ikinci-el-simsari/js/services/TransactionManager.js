import { clamp, fmt } from '../utils.js';
import { INSPECT_RATE, MIN_INSPECT, SKILL_XP_PER_LEVEL } from '../data/constants.js';

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

  // --- Ekspertiz ---
  inspection: function(player, item){
    var lvl = this.skillLevel(player.skills.ekspertiz);
    var discount = clamp(lvl*0.03, 0, 0.4);
    var cost = Math.max(MIN_INSPECT, Math.round(item.askingPrice*INSPECT_RATE*(1-discount)));
    var hours = 1;
    return {
      type:'INSPECT',
      title:'Ekspertiz Yaptır',
      message: item.title + ' için bağımsız ekspertiz raporu istiyorsun.',
      cost: cost,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours),
      riskLabel:'Risksiz — rapor her zaman doğru çıkar.',
      confirmLabel:'Ekspertize Gönder',
      phases:['Randevu alınıyor…','Araç/arsa yerinde inceleniyor…','Rapor yazılıyor…']
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

  // --- Parça alımı ---
  buyPart: function(player, brand, marketEntry){
    var hours = 0.6;
    return {
      type:'BUY_PART',
      title:'Yedek Parça Al',
      message: brand + ' için "' + marketEntry.name + '" satın alınacak.',
      cost: marketEntry.price,
      durationMs: this.hoursToRealMs(hours),
      durationLabel: this.hoursLabel(hours) + ' (tedarikçiden teslim)',
      riskLabel:'Risksiz.',
      confirmLabel:'Satın Al',
      phases:['Tedarikçi aranıyor…','Parça kargoya veriliyor…','Parça teslim alınıyor…']
    };
  },

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
