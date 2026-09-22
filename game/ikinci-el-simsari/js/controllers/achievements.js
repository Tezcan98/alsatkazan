// =====================================================================
//  BAŞARIMLAR — Game.checkAchievements() bunları player/state'e karşı
//  test eder; her `test(game)` true dönen ve henüz açılmamış başarım
//  loglanır, toast gösterir ve player.achievements'a eklenir.
// =====================================================================
export var ACHIEVEMENTS = [
  { id:'ilk-alim', title:'İlk Adım', desc:'İlk aracını, arsanı ya da dükkanını satın al.',
    test: function(g){ return g.state.inventory.length + g.state.shops.length >= 1; } },
  { id:'ilk-satis', title:'İlk Satış', desc:'İlk kez bir şey sat.',
    test: function(g){ return g.player.totalSales >= 1; } },
  { id:'ilk-kar', title:'İlk Kâr', desc:'Kârla bir satış yap.',
    test: function(g){ return g.player.totalProfit > 0 && g.player.totalSales >= 1; } },
  { id:'bes-satis', title:'Deneyimli Simsar', desc:'Toplam 5 satış yap.',
    test: function(g){ return g.player.totalSales >= 5; } },
  { id:'yirmi-satis', title:'Simsarlar Kralı', desc:'Toplam 20 satış yap.',
    test: function(g){ return g.player.totalSales >= 20; } },
  { id:'emlak-krali', title:'Emlak Kralı', desc:'Bir arsaya ev inşa ettir.',
    test: function(g){ return g.state.inventory.some(function(i){ return i.category==='arsa' && i.hasHouse; }); } },
  { id:'borc-kapatildi', title:'Borç Yönetimi', desc:'Bir banka kredisini tamamen kapat.',
    test: function(g){ return g._loanRepaidCount > 0; } },
  { id:'usta-tamirci', title:'Usta Tamirci', desc:'Tamir Ustalığında 10. seviyeye ulaş.',
    test: function(g){ return g.player.skillLevel('tamir') >= 10; } },
  { id:'sabirli', title:'Taş Gibi Sabır', desc:'Sabır yeteneğinde 5. seviyeye ulaş.',
    test: function(g){ return g.player.skillLevel('sabir') >= 5; } },
  { id:'isletme-devi', title:'İşletme Devi', desc:'Aynı anda 2 dükkana sahip ol.',
    test: function(g){ return g.state.shops.length >= 2; } },
  { id:'zengin-simsar', title:'Zengin Simsar', desc:'Kasanda 10.000.000 ₺ biriktir.',
    test: function(g){ return g.player.balance >= 10000000; } },
  { id:'firsatci', title:'Fırsatçı', desc:'Bir "FIRSAT" etiketli ilanı satın al.',
    test: function(g){ return g._boughtDealCount > 0; } },
  { id:'tedbirli', title:'Tedbirli Sürücü', desc:'Bir aracına kasko yaptır.',
    test: function(g){ return g._kaskoCount > 0; } },
  { id:'reklamci', title:'Reklamcı', desc:'Bir ilanını öne çıkar (doping).',
    test: function(g){ return g._boostCount > 0; } },
  { id:'guvenilir-alici', title:'Güvenilir Alıcı', desc:'Bir TRAMER Tam Rapor satın al.',
    test: function(g){ return g._fullInspectCount > 0; } }
];
