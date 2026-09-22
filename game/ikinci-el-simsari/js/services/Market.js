import { rnd, pick } from '../utils.js';
import { Car, Land, Shop } from '../models/Listing.js';
import {
  CAR_MODELS, COLORS, CITIES, TRANS, FUEL, BODY, FAULT_POOL_CAR, HEAVY_FAULT, CAR_AD_PHRASES,
  ARSA_IMAR, ARSA_ISSUES_POOL, ARSA_AD_PHRASES, SHOP_TYPES, DUKKAN_AD_PHRASES,
  PARTS_CATALOG
} from '../data/constants.js';

// =====================================================================
//  PAZAR — ilan ve yedek parça üretimi
// =====================================================================
export var Market = {

  makeCar: function(){
    var year = rnd(2011, 2023);
    var kmBase = (2026 - year) * rnd(9000, 22000);
    var faultCount = Math.random() < 0.18 ? 0 : rnd(1,4);
    var pool = FAULT_POOL_CAR.slice();
    var faults = [];
    for(var i=0;i<faultCount && pool.length>0;i++){
      var idx = Math.floor(Math.random()*pool.length);
      var f = pool.splice(idx,1)[0];
      faults.push({ tag:f.tag, label:f.label, loss:rnd(f.loss[0],f.loss[1]), repairCost:rnd(f.repair[0],f.repair[1]), fixed:false, heavy:false });
    }
    if(Math.random() < 0.10){
      faults.push({ tag:HEAVY_FAULT.tag, label:HEAVY_FAULT.label, loss:rnd(HEAVY_FAULT.loss[0],HEAVY_FAULT.loss[1]), repairCost:rnd(HEAVY_FAULT.repair[0],HEAVY_FAULT.repair[1]), fixed:false, heavy:true });
    }
    var yearFactor = 0.55 + (year-2011) * 0.045;
    var baseValue = Math.round(rnd(170000,260000) * yearFactor);
    var totalLoss = faults.reduce(function(s,f){return s+f.loss;},0);
    var askingBase = baseValue - totalLoss;
    var noise = 0.85 + Math.random()*0.35;
    var askingPrice = Math.max(30000, Math.round(askingBase*noise));

    var shuffled = CAR_AD_PHRASES.slice().sort(function(){return Math.random()-0.5;});
    var carDef = pick(CAR_MODELS);
    return new Car({
      title: year + " " + carDef.brand + " " + carDef.model,
      brand: carDef.brand,
      year: year, km: kmBase, trans: pick(TRANS), fuel: pick(FUEL), body: pick(BODY), color: pick(COLORS),
      location: pick(CITIES),
      description: shuffled[0] + " " + shuffled[1],
      trueValue: baseValue, askingPrice: askingPrice, faults: faults, sellerHonesty: Math.random()
    });
  },

  makeArsa: function(){
    var m2 = rnd(150, 2500);
    var pricePerM2 = rnd(400, 2600);
    var baseValue = Math.round(m2*pricePerM2);
    var issueCount = Math.random() < 0.35 ? 0 : rnd(1,3);
    var pool = ARSA_ISSUES_POOL.slice();
    var issues = [];
    for(var i=0;i<issueCount && pool.length>0;i++){
      var idx = Math.floor(Math.random()*pool.length);
      var it = pool.splice(idx,1)[0];
      issues.push({ tag:it.tag, label:it.label, loss:rnd(it.loss[0], it.loss[1]) });
    }
    var totalLoss = issues.reduce(function(s,f){return s+f.loss;},0);
    var askingBase = baseValue - totalLoss;
    var noise = 0.85 + Math.random()*0.35;
    var askingPrice = Math.max(20000, Math.round(askingBase*noise));
    var shuffled = ARSA_AD_PHRASES.slice().sort(function(){return Math.random()-0.5;});
    return new Land({
      title: m2 + " m² " + pick(ARSA_IMAR) + " Arsa",
      m2: m2, imar: pick(ARSA_IMAR), adaParsel: rnd(100,999) + " / " + rnd(1,40),
      location: pick(CITIES),
      description: shuffled[0] + " " + shuffled[1],
      trueValue: baseValue, askingPrice: askingPrice, faults: issues, sellerHonesty: Math.random()
    });
  },

  makeShop: function(){
    var st = pick(SHOP_TYPES);
    var shuffled = DUKKAN_AD_PHRASES.slice().sort(function(){return Math.random()-0.5;});
    return new Shop({
      shopType: st.type,
      title: pick(CITIES) + " " + st.title + " — Devren Satılık",
      capacity: rnd(st.capacity[0], st.capacity[1]+1),
      rent: rnd(st.rent[0], st.rent[1]),
      location: pick(CITIES),
      description: shuffled[0] + " " + shuffled[1],
      trueValue: 0, faults: [],
      askingPrice: rnd(st.price[0], st.price[1]),
      accepts: st.accepts
    });
  },

  refreshListings: function(){
    var listings = [];
    var carCount = rnd(4,6), arsaCount = rnd(2,3), shopCount = rnd(1,2);
    for(var i=0;i<carCount;i++) listings.push(this.makeCar());
    for(var j=0;j<arsaCount;j++) listings.push(this.makeArsa());
    for(var k=0;k<shopCount;k++) listings.push(this.makeShop());
    return listings;
  },

  refreshPartsMarket: function(){
    var market = [];
    CAR_MODELS.forEach(function(m){
      PARTS_CATALOG.forEach(function(p){
        market.push({
          brand: m.brand, tag: p.tag, name: p.name,
          price: Math.round(p.basePrice * m.mult * (0.8 + Math.random()*0.5))
        });
      });
    });
    return market;
  }
};
