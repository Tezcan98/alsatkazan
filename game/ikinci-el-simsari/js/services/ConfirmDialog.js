import { fmt } from '../utils.js';

// =====================================================================
//  ONAY MODALİ
// =====================================================================
export var ConfirmDialog = {
  root: null,
  init: function(){ this.root = document.getElementById('modalRoot'); },
  ask: function(desc, onConfirm){
    var self = this;
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    var box = document.createElement('div');
    box.className = 'modal-box';

    var h3 = document.createElement('h3');
    h3.textContent = 'Emin misin? — ' + desc.title;
    box.appendChild(h3);

    var msg = document.createElement('div');
    msg.className = 'mmsg';
    msg.textContent = desc.message;
    box.appendChild(msg);

    function row(label, val){
      var r = document.createElement('div');
      r.className = 'mrow';
      var l = document.createElement('span'); l.textContent = label;
      var v = document.createElement('b'); v.textContent = val;
      r.appendChild(l); r.appendChild(v);
      box.appendChild(r);
    }
    if(desc.cost) row('Ücret', fmt(desc.cost));
    else row('Ücret', 'Ücretsiz');
    if(desc.estPrice) row('Tahmini satış', fmt(desc.estPrice));
    row('Süre', desc.durationLabel || '—');
    if(desc.riskLabel) row('Risk', desc.riskLabel);

    var actions = document.createElement('div');
    actions.className = 'modal-actions';
    var cancel = document.createElement('button');
    cancel.className = 'btn-ghost';
    cancel.textContent = 'Vazgeç';
    cancel.onclick = function(){ self.close(backdrop); };
    var confirm = document.createElement('button');
    confirm.className = desc.danger ? 'btn-red' : 'btn-orange';
    confirm.textContent = desc.confirmLabel || 'Onayla';
    confirm.onclick = function(){ self.close(backdrop); onConfirm(); };
    actions.appendChild(cancel);
    actions.appendChild(confirm);
    box.appendChild(actions);

    backdrop.appendChild(box);
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop) self.close(backdrop); });
    this.root.appendChild(backdrop);
  },
  close: function(backdrop){
    if(backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }
};
