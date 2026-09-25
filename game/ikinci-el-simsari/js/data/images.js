// =====================================================================
//  GÖRSEL KAYNAKLARI — gerçek görsel dosyalar (emoji yok)
// =====================================================================
// Artifact ortamının güvenlik politikası dış sitelerden resim
// yüklenmesine izin vermiyor, bu yüzden görseller oyunla birlikte
// yayınlanan kendi dosyalarımız (img/*.png) — üretilen düz-illüstrasyon
// sahne görselleri, emoji/ikon değil gerçek bitmap görsel dosyaları.
// Kasa tipine göre araç görseli, imar tipine göre arsa tonu seçilir;
// her ilanın kendine özgü kimliğine göre hafif bir renk varyasyonu
// (CSS filter) uygulanarak aynı görsel tekrar etse de ilanlar birbirinden
// görsel olarak ayrışır.
var CAR_IMG_BY_BODY = {
  "Sedan": "img/car_sedan.png",
  "Hatchback": "img/car_hatchback.png",
  "SUV": "img/car_suv.png",
  "Station Wagon": "img/car_wagon.png"
};

function hueForId(id){
  // Basit deterministik dağıtım: aynı ilan her zaman aynı tonu alır.
  return (id * 47) % 360;
}

export const IMG = {
  carThumb: function(item){ return CAR_IMG_BY_BODY[item.body] || 'img/car_sedan.png'; },
  carHero: function(item){ return CAR_IMG_BY_BODY[item.body] || 'img/car_sedan.png'; },
  carFilter: function(item){ return 'hue-rotate(' + hueForId(item.id) + 'deg) saturate(1.05)'; },

  landThumb: function(item){ return 'img/land.png'; },
  landHero: function(item){ return 'img/land.png'; },
  landHouseThumb: function(item){ return 'img/land_house.png'; },
  landHouseHero: function(item){ return 'img/land_house.png'; },
  landFilter: function(item){ return 'hue-rotate(' + hueForId(item.id) + 'deg) saturate(0.9)'; },

  shopThumb: function(item){ return item.shopType==='galeri' ? 'img/shop_galeri.png' : 'img/shop_emlak.png'; },
  shopHero: function(item){ return item.shopType==='galeri' ? 'img/shop_galeri.png' : 'img/shop_emlak.png'; },
  shopFilter: function(item){ return 'hue-rotate(' + hueForId(item.id) + 'deg) saturate(0.9)'; },

  icon: {
    mechanicMahalle: 'img/mechanic_mahalle.png',
    mechanicBilinen: 'img/mechanic_bilinen.png',
    mechanicYetkili: 'img/mechanic_yetkili.png',
    parts: 'img/parts.png',
    shopsPanel: 'img/panel_shops.png',
    tenantsPanel: 'img/panel_tenants.png',
    profilePanel: 'img/panel_profile.png',
    skillsPanel: 'img/panel_skills.png',
    ledgerPanel: 'img/panel_ledger.png',
    controlPanel: 'img/panel_control.png',
    avatar: 'img/avatar.png',
    hero: 'img/hero_banner.png',
    trophy: 'img/icon_trophy.svg',
    tasks: 'img/icon_tasks.svg',
    event: 'img/icon_event.svg'
  },

  nav: {
    listings: 'img/nav_listings.png',
    garage: 'img/nav_garage.png',
    messages: 'img/nav_messages.png',
    panel: 'img/nav_panel.png'
  }
};
