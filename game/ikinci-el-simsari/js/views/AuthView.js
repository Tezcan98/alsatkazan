import { AuthService } from '../services/AuthService.js';
import { Persistence } from '../services/Persistence.js';
import { Game } from '../controllers/GameController.js';
import { toast } from '../utils.js';

export var AuthView={
  init:function(){
    var b=document.getElementById('accountBtn');if(b)b.onclick=function(){AuthView.open()};
    window.addEventListener('alsatkazan-auth-changed',function(){
      AuthView.updateButton();
      if(AuthService.user)Persistence.syncAfterLogin(Game).then(function(){Game.render()});else Game.render();
    });
    this.updateButton();
  },
  updateButton:function(){
    var b=document.getElementById('accountBtn');if(!b)return;
    if(AuthService.user){var n=(AuthService.user.user_metadata&&AuthService.user.user_metadata.display_name)||AuthService.user.email.split('@')[0];b.textContent='● '+n;b.classList.add('signed')}
    else{b.textContent='Giriş / Üyelik';b.classList.remove('signed')}
  },
  open:function(){
    var root=document.getElementById('modalRoot');if(!root)return;root.innerHTML='';
    var back=document.createElement('div');back.className='modal-backdrop auth-backdrop';
    var box=document.createElement('div');box.className='modal-box auth-box';
    var close=document.createElement('button');close.className='auth-close';close.textContent='×';close.onclick=function(){root.innerHTML=''};box.appendChild(close);
    if(!AuthService.configured){box.innerHTML+='<h2>Simsar hesabı</h2><p class="auth-note">Üyelik altyapısı hazır. Supabase proje URL ve publishable key değerlerini js/config.js içine eklemen gerekiyor.</p>';back.appendChild(box);root.appendChild(back);return}
    if(AuthService.user)this.account(box,root);else this.login(box,root);
    back.appendChild(box);root.appendChild(back);
  },
  field:function(label,type,placeholder){
    var w=document.createElement('label');w.className='auth-field';var l=document.createElement('span');l.textContent=label;w.appendChild(l);
    var i=document.createElement('input');i.type=type;i.placeholder=placeholder||'';i.autocomplete=type==='password'?'current-password':type==='email'?'email':'name';w.appendChild(i);return {wrap:w,input:i};
  },
  login:function(box,root){
    box.innerHTML='<button class="auth-close">×</button><h2>Simsar hesabı</h2><p class="auth-note">İlerlemeni başka cihazda da korumak için giriş yap.</p>';
    box.querySelector('.auth-close').onclick=function(){root.innerHTML=''};
    var e=this.field('E-posta','email','ornek@mail.com'),p=this.field('Şifre','password','••••••••');box.appendChild(e.wrap);box.appendChild(p.wrap);
    var msg=document.createElement('div');msg.className='auth-msg';box.appendChild(msg);
    var row=document.createElement('div');row.className='auth-actions';
    var inb=document.createElement('button');inb.className='btn-navy';inb.textContent='Giriş yap';inb.onclick=async function(){msg.textContent='Giriş yapılıyor...';try{await AuthService.signIn(e.input.value,p.input.value);root.innerHTML='';toast('Hoş geldin.');}catch(x){msg.textContent=x.message||'Giriş yapılamadı.'}};
    var rb=document.createElement('button');rb.className='btn-ghost';rb.textContent='Üye ol';rb.onclick=function(){AuthView.register(box,root)};
    row.appendChild(inb);row.appendChild(rb);box.appendChild(row);
    var forgot=document.createElement('button');forgot.className='auth-link';forgot.textContent='Şifremi unuttum';forgot.onclick=function(){AuthView.forgot(box,root)};box.appendChild(forgot);
  },
  register:function(box,root){
    box.innerHTML='<button class="auth-close">×</button><h2>Yeni hesap</h2><p class="auth-note">Doğrulama e-postasını onayladıktan sonra hesabın aktif olur.</p>';
    box.querySelector('.auth-close').onclick=function(){root.innerHTML=''};
    var n=this.field('Oyuncu adı','text','Örn. Enes'),e=this.field('E-posta','email','ornek@mail.com'),p=this.field('Şifre','password','En az 8 karakter');box.appendChild(n.wrap);box.appendChild(e.wrap);box.appendChild(p.wrap);
    var msg=document.createElement('div');msg.className='auth-msg';box.appendChild(msg);
    var b=document.createElement('button');b.className='btn-orange';b.textContent='Hesap oluştur';b.onclick=async function(){if(p.input.value.length<8){msg.textContent='Şifre en az 8 karakter olmalı.';return}try{await AuthService.signUp(e.input.value,p.input.value,n.input.value);msg.textContent='Doğrulama e-postası gönderildi. E-postadaki bağlantıya tıklayıp ardından giriş yap.'}catch(x){msg.textContent=x.message||'Kayıt oluşturulamadı.'}};
    box.appendChild(b);
    var back=document.createElement('button');back.className='auth-link';back.textContent='← Girişe dön';back.onclick=function(){AuthView.login(box,root)};box.appendChild(back);
  },
  forgot:function(box,root){
    box.innerHTML='<button class="auth-close">×</button><h2>Şifre yenile</h2><p class="auth-note">E-posta adresine yenileme bağlantısı gönderilecek.</p>';
    box.querySelector('.auth-close').onclick=function(){root.innerHTML=''};
    var e=this.field('E-posta','email','ornek@mail.com');box.appendChild(e.wrap);var msg=document.createElement('div');msg.className='auth-msg';box.appendChild(msg);
    var b=document.createElement('button');b.className='btn-navy';b.textContent='Bağlantı gönder';b.onclick=async function(){try{await AuthService.resetPassword(e.input.value);msg.textContent='Bağlantı gönderildi.'}catch(x){msg.textContent=x.message||'Gönderilemedi.'}};box.appendChild(b);
    var back=document.createElement('button');back.className='auth-link';back.textContent='← Girişe dön';back.onclick=function(){AuthView.login(box,root)};box.appendChild(back);
  },
  account:function(box,root){
    var u=AuthService.user,n=(u.user_metadata&&u.user_metadata.display_name)||u.email.split('@')[0];
    box.innerHTML='<button class="auth-close">×</button><h2>Hesabım</h2><p class="auth-note"><b>'+String(n).replace(/[<>]/g,'')+'</b><br>'+String(u.email).replace(/[<>]/g,'')+'</p><div class="auth-cloud">☁ Oyun kaydı sunucuda<br><span>Aynı hesapla başka cihazdan devam edebilirsin.</span></div>';
    box.querySelector('.auth-close').onclick=function(){root.innerHTML=''};
    var save=document.createElement('button');save.className='btn-ghost';save.textContent='Şimdi kaydet';save.onclick=function(){Persistence.save(Game).then(function(){toast('Oyun sunucuya kaydedildi.')})};box.appendChild(save);
    var out=document.createElement('button');out.className='btn-red';out.textContent='Çıkış yap';out.onclick=async function(){await Persistence.save(Game);await AuthService.signOut();root.innerHTML='';toast('Çıkış yapıldı.')};box.appendChild(out);
  }
};
