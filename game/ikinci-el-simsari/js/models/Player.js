import { clamp, toast } from '../utils.js';
import { SKILL_LABELS, SKILL_XP_PER_LEVEL } from '../data/constants.js';

// =====================================================================
//  OYUNCU (Model katmanı)
// =====================================================================
export function Player(){
  this.balance = 25000000;
  this.startBalance = 25000000;
  this.skills = { tamir:0, pazarlik:0, ekspertiz:0, isletme:0, sabir:0 };
  this.name = 'Simsar';
  this.totalSales = 0;
  this.totalProfit = 0;
  this.carsSold = 0;
  this.arsaSold = 0;
  this.dukkanSold = 0;
  this.achievements = [];
  // Harita / seyahat sistemi: oyuncunun şu anki şehri (bkz. Game.doTravel)
  this.currentCity = 'İstanbul';
  // Ev şehri: oyun başında bir kez sabitlenir, seyahatle DEĞİŞMEZ — günlük
  // kira burası için ödenir ve pansiyon masrafı bu şehirden (ve dükkan
  // şehirlerinden) uzaktayken devreye girer (bkz. GameController.doNextDay)
  this.homeCity = 'İstanbul';
  // Seyahat aracı: garajdaki bir arabanın id'si — seçiliyse seyahatlerde
  // "o araçla gidiliyor" sayılır ve km'si artar (bkz. GarageView, Game.doTravel)
  this.travelCarId = null;
  // Meta-ilerleme: lig, seri ve günlük görevler
  this.xp = 0;
  this.dealStreak = 0;
  this.bestDealStreak = 0;
  this.dailyTasks = [];
  this.dailyTaskDay = 0;
}
Player.prototype.skillLevel = function(key){
  return clamp(1 + Math.floor(this.skills[key]/SKILL_XP_PER_LEVEL), 1, 10);
};
Player.prototype.addXp = function(key, amount){
  var before = this.skillLevel(key);
  this.skills[key] += amount;
  var after = this.skillLevel(key);
  if(after > before) toast(SKILL_LABELS[key] + ' seviye ' + after + ' oldu!');
};
Player.prototype.spend = function(amount){ this.balance -= amount; };
Player.prototype.earn = function(amount){ this.balance += amount; };
Player.prototype.canAfford = function(amount){ return this.balance >= amount; };
