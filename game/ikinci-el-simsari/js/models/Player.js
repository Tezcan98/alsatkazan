import { clamp, toast } from '../utils.js';
import { SKILL_LABELS, SKILL_XP_PER_LEVEL } from '../data/constants.js';

// =====================================================================
//  OYUNCU (Model katmanı)
// =====================================================================
export function Player(){
  this.balance = 2500000;
  this.startBalance = 2500000;
  this.skills = { tamir:0, pazarlik:0, ekspertiz:0, isletme:0, sabir:0 };
  this.name = 'Simsar';
  this.totalSales = 0;
  this.totalProfit = 0;
  this.loan = null; // { amount, remaining, dailyRate, dailyPayment }
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
