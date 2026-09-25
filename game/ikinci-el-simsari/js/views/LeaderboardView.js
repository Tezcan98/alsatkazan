import { fmt } from '../utils.js';
import { Game } from '../controllers/GameController.js';

export var LeaderboardView = {
  render: function(container){
    var p=Game.player, s=Game.state, league=Game.leagueInfo(), score=Game.score();
    var rivals=[
      {name:'Murat “Turbo”',score:18640,tag:'Hızlı Al-Sat'},
      {name:'Ayşe Hanım',score:15380,tag:'Ekspertizci'},
      {name:'Kemal Usta',score:12820,tag:'Tamirci'},
      {name:'Serkan Emlak',score:10950,tag:'Emlakçı'},
      {name:'Burak Pazarlıkçı',score:8740,tag:'Pazarlıkçı'}
    ];
    var playerRow={name:p.name,score:score,tag:league.name,you:true};
    var rows=rivals.concat([playerRow]).sort(function(a,b){return b.score-a.score;});
    var rank=rows.findIndex(function(x){return x.you;})+1;

    var hero=document.createElement('div');
    hero.className='league-hero';
    hero.innerHTML='<div class="league-orb">★</div><div><div class="kicker">SİMSAR LİGİ</div><h1>'+league.name+'</h1><p>Prestij skorun <b>'+score.toLocaleString('tr-TR')+'</b> · Sıra #'+rank+'</p></div>';
    container.appendChild(hero);

    var progress=document.createElement('div'); progress.className='league-progress card';
    var nextText=league.next ? league.next.name+' için '+league.next.min.toLocaleString('tr-TR')+' puan' : 'Zirvedesin';
    progress.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px"><b>Lig ilerlemesi</b><span class="kicker">'+nextText+'</span></div><div class="progress-track"><div class="progress-fill" style="width:'+league.progress+'%"></div></div><div class="kicker" style="margin-top:6px">'+league.progress+'% · En iyi satış serisi: '+p.bestDealStreak+'</div>';
    container.appendChild(progress);

    var grid=document.createElement('div'); grid.className='stat-grid';
    [
      ['Skor',score.toLocaleString('tr-TR')],
      ['Satış',p.totalSales],
      ['Toplam kâr',fmt(p.totalProfit)],
      ['Meta XP',p.xp]
    ].forEach(function(x){
      var c=document.createElement('div'); c.className='stat-card'; c.innerHTML='<div class="kicker">'+x[0]+'</div><strong>'+x[1]+'</strong>'; grid.appendChild(c);
    });
    container.appendChild(grid);

    var event=s.marketEvent;
    var ec=document.createElement('div'); ec.className='event-card';
    ec.innerHTML='<div class="event-icon">⚡</div><div><b>'+event.title+'</b><div>'+event.desc+'</div></div>';
    container.appendChild(ec);

    var h=document.createElement('h2'); h.className='section'; h.textContent='Bugünün Görevleri'; container.appendChild(h);
    var tasks=document.createElement('div'); tasks.className='task-grid';
    (p.dailyTasks||[]).forEach(function(t){
      var pct=Math.round(t.progress/t.target*100);
      var card=document.createElement('div'); card.className='task-card '+(t.done?'done':'');
      card.innerHTML='<div class="task-top"><b>'+t.title+'</b><span>+'+fmt(t.reward)+'</span></div><div class="kicker">'+t.desc+'</div><div class="progress-track"><div class="progress-fill" style="width:'+pct+'%"></div></div><div class="task-foot">'+(t.done?'TAMAMLANDI':t.progress.toLocaleString('tr-TR')+' / '+t.target.toLocaleString('tr-TR'))+'</div>';
      tasks.appendChild(card);
    });
    container.appendChild(tasks);

    var rh=document.createElement('h2'); rh.className='section'; rh.textContent='Sıralama'; container.appendChild(rh);
    var board=document.createElement('div'); board.className='leaderboard';
    rows.forEach(function(row,i){
      var el=document.createElement('div'); el.className='leader-row '+(row.you?'you':'');
      el.innerHTML='<div class="rank">#'+(i+1)+'</div><div class="leader-avatar">'+(row.you?'S':'★')+'</div><div class="leader-info"><b>'+row.name+'</b><span>'+row.tag+'</span></div><strong>'+row.score.toLocaleString('tr-TR')+'</strong>';
      board.appendChild(el);
    });
    container.appendChild(board);

    var note=document.createElement('div'); note.className='desc-note'; note.style.marginTop='12px';
    note.textContent='Skor; kâr, satış, yetenekler, başarımlar, varlık değeri, meta XP ve satış serisine göre hesaplanır.';
    container.appendChild(note);
  }
};
