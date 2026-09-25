import { uid, fmt } from '../utils.js';
import { IMG } from '../data/images.js';

// =====================================================================
//  VARLIK SINIFLARI (Model katmanı)
// =====================================================================
export function Listing(props){
  Object.assign(this, props);
  this.id = uid();
  this.priceAsked = false;
  this.sellerClaims = {};
  this.negotiationDone = false;
  this.messages = [];
  this.inspected = false;
  this.owned = false;
  // garaj satış-ilanı durumu (bkz. GameController.doListForSale)
  this.forSale = false;
  this.listedPrice = 0;
  this.daysListed = 0;
  this.pendingOffer = null;
  this.favorite = false;
  this.daysOwned = 0;
  // ilan doping (bkz. GameController.doBoostListing)
  this.boosted = false;
  this.boostDaysLeft = 0;
  // ekspertiz yaptırıldı mı (motor/boya/diğer arızaları açar)
  this.ekspertizDone = false;
  // TRAMER kaydı sorgulandı mı (sadece araba — ağır hasar kayıtlarını açar)
  this.tramerDone = false;
}
Listing.prototype.currentValue = function(){
  var remainingLoss = this.faults.filter(function(f){return !f.fixed;}).reduce(function(s,f){return s+f.loss;},0);
  return Math.max(500, this.trueValue - remainingLoss);
};
Listing.prototype.thumb = function(){ return null; };
Listing.prototype.hero = function(){ return null; };
Listing.prototype.imgFilter = function(){ return ''; };
Listing.prototype.specRows = function(){ return []; };

export function Car(base){
  Listing.call(this, Object.assign({category:'araba'}, base));
  // kasko sigortası (bkz. GameController.doToggleKasko)
  this.insured = false;
}
Car.prototype = Object.create(Listing.prototype);
Car.prototype.thumb = function(){ return IMG.carThumb(this); };
Car.prototype.hero = function(){ return IMG.carHero(this); };
Car.prototype.imgFilter = function(){ return IMG.carFilter(this); };
Car.prototype.specRows = function(){
  var rows = [
    ['Yıl', this.year],
    ['KM', this.km.toLocaleString('tr-TR')],
    ['Vites', this.trans],
    ['Yakıt', this.fuel],
    ['Kasa Tipi', this.body],
    ['Renk', this.color],
    ['Hasar Kaydı', this.damageRecord ? fmt(this.damageRecord) : 'Hasar kaydı görünmüyor'],
    ['Ağır Hasarlı', this.heavyDamage ? 'Evet' : 'Hayır'],
    ['Bakım', this.maintenanceHistory || 'Belirtilmemiş'],
    ['Konum', this.location]
  ];
  if(this.owned) rows.push(['Kasko', this.insured ? 'Sigortalı' : 'Sigortasız']);
  return rows;
};
Car.prototype.metaLine = function(){
  var seller = this.sellerType==='galeri' ? (this.galeriName || 'Galeri') : 'Bireysel satıcı';
  return this.km.toLocaleString('tr-TR') + ' km · ' + this.trans + ' · ' + seller + ' · ' + this.location;
};

export function Land(base){
  Listing.call(this, Object.assign({category:'arsa'}, base));
  // ev inşaatı durumu (bkz. GameController.doStartConstruction)
  this.hasHouse = false;
  this.underConstruction = false;
  this.constructionDaysLeft = 0;
}
Land.prototype = Object.create(Listing.prototype);
Land.prototype.thumb = function(){ return this.hasHouse ? IMG.landHouseThumb(this) : IMG.landThumb(this); };
Land.prototype.hero = function(){ return this.hasHouse ? IMG.landHouseHero(this) : IMG.landHero(this); };
Land.prototype.imgFilter = function(){ return this.hasHouse ? '' : IMG.landFilter(this); };
Land.prototype.specRows = function(){
  var rows = [
    ['m²', this.m2.toLocaleString('tr-TR')],
    ['İmar Durumu', this.imar],
    ['Ada / Parsel', this.adaParsel],
    ['Konum', this.location]
  ];
  if(this.hasHouse) rows.push(['Yapı', 'Üzerinde ev inşa edilmiş']);
  else if(this.underConstruction) rows.push(['Yapı', 'İnşaat sürüyor (' + this.constructionDaysLeft + ' gün kaldı)']);
  return rows;
};
Land.prototype.metaLine = function(){
  var tag = this.hasHouse ? 'Üzerinde ev var · ' : this.underConstruction ? 'İnşaat sürüyor · ' : '';
  return tag + this.m2 + ' m² · ' + this.imar + ' · ' + this.location;
};

export function Shop(base){
  Listing.call(this, Object.assign({category:'dukkan'}, base));
  this.slots = [];
  this.upgrades = [];
  this.rentMult = 1;
  this.passiveBonus = 0;
  this.saleBonus = 1;
  this.satisfactionGuard = false;
  this.mode = 'kendim';
  this.tenant = null;
  this.tenantCandidate = null;
}
Shop.prototype = Object.create(Listing.prototype);
Shop.prototype.thumb = function(){ return IMG.shopThumb(this); };
Shop.prototype.hero = function(){ return IMG.shopHero(this); };
Shop.prototype.imgFilter = function(){ return IMG.shopFilter(this); };
Shop.prototype.specRows = function(){
  return [
    ['Tür', this.shopType==='galeri' ? 'Oto Galerisi (araba kabul eder)' : 'Emlak Ofisi (arsa kabul eder)'],
    ['Aylık Kira', fmt(this.rent)],
    ['Vitrin Kapasitesi', this.capacity + ' ürün'],
    ['Konum', this.location]
  ];
};
Shop.prototype.metaLine = function(){ return (this.shopType==='galeri' ? 'Oto Galerisi' : 'Emlak Ofisi') + ' · kira ' + fmt(this.rent) + ' · ' + this.location; };
