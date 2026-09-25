import { Car, Land, Shop } from '../models/Listing.js';
import { Player } from '../models/Player.js';
import { AuthService } from './AuthService.js';

var DB_NAME='alsatkazan-local', DB_VERSION=1, STORE='saves', dbPromise=null, saveTimer=null;
function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise(function(resolve,reject){
    var req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
    req.onsuccess=function(){resolve(req.result)};req.onerror=function(){reject(req.error)};
  });return dbPromise;
}
async function localGet(){var db=await openDb();return new Promise(function(resolve,reject){var r=db.transaction(STORE,'readonly').objectStore(STORE).get('guest');r.onsuccess=function(){resolve(r.result||null)};r.onerror=function(){reject(r.error)}})}
async function localPut(v){var db=await openDb();return new Promise(function(resolve,reject){var tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(v,'guest');tx.oncomplete=function(){resolve()};tx.onerror=function(){reject(tx.error)}})}
function revive(x){
  if(!x)return null;
  var o=x.category==='araba'?new Car(x):x.category==='arsa'?new Land(x):x.category==='dukkan'?new Shop(x):Object.assign({},x);
  Object.assign(o,x);return o;
}
function snapshot(game){
  var s=JSON.parse(JSON.stringify(game.state));
  s.listings=(game.state.listings||[]).map(function(x){return JSON.parse(JSON.stringify(x))});
  s.inventory=(game.state.inventory||[]).map(function(x){return JSON.parse(JSON.stringify(x))});
  s.shops=(game.state.shops||[]).map(function(x){return JSON.parse(JSON.stringify(x))});
  s.openDetailId=null;s.openShopId=null;s.openMessageThreadItemId=null;s.mapSelectedCity=null;s.travelTargetCity=null;s.controlPanelOpen=false;
  return {version:2,savedAt:new Date().toISOString(),player:JSON.parse(JSON.stringify(game.player)),state:s,counters:{boughtDealCount:game._boughtDealCount||0,kaskoCount:game._kaskoCount||0,boostCount:game._boostCount||0,fullInspectCount:game._fullInspectCount||0,tramerCaughtCount:game._tramerCaughtCount||0,msgSeq:game._msgSeq||0}};
}
function restore(game,d){
  if(!d||!d.player||!d.state)return false;
  Object.assign(game.player,new Player(),d.player);
  Object.keys(d.state).forEach(function(k){if(k!=='listings'&&k!=='inventory'&&k!=='shops')game.state[k]=d.state[k]});
  game.state.listings=(d.state.listings||[]).map(revive).filter(Boolean);
  game.state.inventory=(d.state.inventory||[]).map(revive).filter(Boolean);
  game.state.shops=(d.state.shops||[]).map(revive).filter(Boolean);
  var c=d.counters||{};game._boughtDealCount=c.boughtDealCount||0;game._kaskoCount=c.kaskoCount||0;game._boostCount=c.boostCount||0;game._fullInspectCount=c.fullInspectCount||0;game._tramerCaughtCount=c.tramerCaughtCount||0;game._msgSeq=c.msgSeq||0;return true;
}
async function serverLoad(){
  if(!AuthService.client||!AuthService.user)return null;
  var r=await AuthService.client.from('game_saves').select('state').eq('user_id',AuthService.user.id).maybeSingle();
  if(r.error)throw r.error;return r.data?r.data.state:null;
}
async function serverSave(data){
  if(!AuthService.client||!AuthService.user)return;
  var r=await AuthService.client.from('game_saves').upsert({user_id:AuthService.user.id,state:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(r.error)throw r.error;
}
export var Persistence={
  init:async function(){await openDb()},
  hydrate:async function(game){
    var remote=null;
    if(AuthService.user){try{remote=await serverLoad()}catch(e){console.warn('Sunucu kayıt yüklenemedi',e)}}
    if(remote){restore(game,remote);return true}
    var local=await localGet();
    if(local){restore(game,local);if(AuthService.user)await serverSave(local).catch(function(e){console.warn('Yerel kayıt taşınamadı',e)});return true}
    return false;
  },
  save:async function(game){
    var d=snapshot(game);try{await localPut(d)}catch(e){console.warn('Yerel kayıt kaydedilemedi',e)}
    if(AuthService.user){try{await serverSave(d)}catch(e){console.warn('Sunucu kayıt kaydedilemedi',e)}}
  },
  scheduleSave:function(game){clearTimeout(saveTimer);saveTimer=setTimeout(function(){Persistence.save(game)},700)},
  syncAfterLogin:async function(game){var loaded=await this.hydrate(game);if(!loaded)await this.save(game);return loaded}
};
