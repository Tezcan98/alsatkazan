import { fmt } from '../utils.js';

// =====================================================================
//  BİLANÇO MODALİ — gün kapanınca otomatik gösterilen gün-sonu özeti
// =====================================================================
// ConfirmDialog ile aynı modal-backdrop/modal-box CSS kalıbını kullanır
// (bkz. css/style.css ".modal-*"), ama onaylatmak yerine sadece o günün
// gelir/gider kalemlerini listeleyip "Kapat" ile kapanır. GameController.
// doNextDay() günlük işlemleri bitirdikten sonra tek seferlik çağırır.
export var BilancoDialog = {
  root: null,
  init: function(){ this.root = document.getElementById('modalRoot'); },
  show: function(data){
    var self = this;
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    var box = document.createElement('div');
    box.className = 'modal-box bilanco';

    var h3 = document.createElement('h3');
    h3.textContent = 'Gün ' + data.day + ' Bilançosu';
    box.appendChild(h3);

    var msg = document.createElement('div');
    msg.className = 'mmsg';
    msg.textContent = 'Gün kapanırken gerçekleşen otomatik gelir/giderlerin özeti.';
    box.appendChild(msg);

    function row(label, val, cls){
      var r = document.createElement('div');
      r.className = 'mrow';
      var l = document.createElement('span'); l.textContent = label;
      var v = document.createElement('b'); v.textContent = val;
      if(cls) v.className = cls;
      r.appendChild(l); r.appendChild(v);
      box.appendChild(r);
    }

    row('Gün başındaki bakiye', fmt(data.startBalance));

    if(data.expense.length===0 && data.income.length===0){
      var e = document.createElement('div');
      e.className = 'desc-note';
      e.style.margin = '6px 0';
      e.textContent = 'Bugün otomatik bir gelir/gider kalemi oluşmadı.';
      box.appendChild(e);
    } else {
      if(data.expense.length>0){
        var expHead = document.createElement('div');
        expHead.className = 'kicker';
        expHead.style.marginTop = '8px';
        expHead.textContent = 'GİDERLER';
        box.appendChild(expHead);
        data.expense.forEach(function(it){ row(it.label, '- ' + fmt(it.amount), 'bilanco-neg'); });
      }
      if(data.income.length>0){
        var incHead = document.createElement('div');
        incHead.className = 'kicker';
        incHead.style.marginTop = '8px';
        incHead.textContent = 'GELİRLER';
        box.appendChild(incHead);
        data.income.forEach(function(it){ row(it.label, '+ ' + fmt(it.amount), 'bilanco-pos'); });
      }
    }

    row('Net değişim', (data.net>=0?'+ ':'- ') + fmt(Math.abs(data.net)), data.net>=0 ? 'bilanco-pos' : 'bilanco-neg');
    row('Gün sonu bakiye', fmt(data.endBalance));

    var actions = document.createElement('div');
    actions.className = 'modal-actions';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-orange';
    closeBtn.textContent = 'Kapat';
    closeBtn.onclick = function(){ self.close(backdrop); };
    actions.appendChild(closeBtn);
    box.appendChild(actions);

    backdrop.appendChild(box);
    backdrop.addEventListener('click', function(ev){ if(ev.target===backdrop) self.close(backdrop); });
    this.root.appendChild(backdrop);
  },
  close: function(backdrop){
    if(backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }
};
