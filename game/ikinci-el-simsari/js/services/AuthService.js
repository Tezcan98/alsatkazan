import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config.js';

var configured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_URL.includes('YOUR_') && !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_'));
var client = configured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
}) : null;

export var AuthService = {
  client: client, configured: configured, user: null,
  init: async function(){
    if(!client) return null;
    var self=this, result=await client.auth.getSession();
    this.user=result.data && result.data.session ? result.data.session.user : null;
    client.auth.onAuthStateChange(function(_event,session){
      self.user=session ? session.user : null;
      window.dispatchEvent(new CustomEvent('alsatkazan-auth-changed',{detail:{user:self.user}}));
    });
    return this.user;
  },
  signUp: async function(email,password,name){
    if(!client) throw new Error('Üyelik sistemi yapılandırılmamış.');
    var redirectUrl=window.location.origin+window.location.pathname;
    var r=await client.auth.signUp({email:email.trim().toLowerCase(),password:password,options:{emailRedirectTo:redirectUrl,data:{display_name:(name||'Simsar').trim()}}});
    if(r.error) throw r.error; this.user=r.data.user||null; return r.data;
  },
  signIn: async function(email,password){
    if(!client) throw new Error('Üyelik sistemi yapılandırılmamış.');
    var r=await client.auth.signInWithPassword({email:email.trim().toLowerCase(),password:password});
    if(r.error) throw r.error; this.user=r.data.user; return r.data;
  },
  signOut: async function(){ if(!client)return; var r=await client.auth.signOut(); if(r.error)throw r.error; this.user=null; },
  resendVerification: async function(email){
    if(!client) throw new Error('Üyelik sistemi yapılandırılmamış.');
    var r=await client.auth.resend({type:'signup',email:email.trim().toLowerCase()}); if(r.error)throw r.error; return r.data;
  },
  resetPassword: async function(email){
    if(!client) throw new Error('Üyelik sistemi yapılandırılmamış.');
    var r=await client.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+window.location.pathname});
    if(r.error)throw r.error; return r.data;
  },
  updatePassword: async function(password){
    if(!client)throw new Error('Üyelik sistemi yapılandırılmamış.');
    var r=await client.auth.updateUser({password:password}); if(r.error)throw r.error; return r.data;
  },
  updateName: async function(name){
    if(!client||!this.user)return;
    var r=await client.auth.updateUser({data:{display_name:(name||'Simsar').trim()}}); if(r.error)throw r.error; this.user=r.data.user;
  }
};
