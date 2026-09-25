// =====================================================================
//  VERİ TANIMLARI (sabit havuzlar)
// =====================================================================

// Tüm fiyatlar artık doğrudan gerçekçi 2026 Türkiye piyasası seviyesinde
// sabit sayılar olarak yazılıyor — genel bir "ölçek/oran" kavramı yok.
export const CAR_MODELS = [
  {brand:"Volkswagen", model:"Golf 1.6", mult:1.30},
  {brand:"Renault", model:"Megane 1.5 dCi", mult:0.95},
  {brand:"Fiat", model:"Egea 1.4", mult:0.80},
  {brand:"Toyota", model:"Corolla 1.6", mult:1.10},
  {brand:"Hyundai", model:"i20 1.4", mult:0.90},
  {brand:"Ford", model:"Focus 1.5", mult:1.00},
  {brand:"Opel", model:"Astra 1.4", mult:0.95},
  {brand:"Honda", model:"Civic 1.6", mult:1.15},
  {brand:"Peugeot", model:"301 1.5", mult:0.90},
  {brand:"Dacia", model:"Duster 1.5 dCi", mult:0.70},
  {brand:"Skoda", model:"Octavia 1.6", mult:1.20},
  {brand:"Citroen", model:"C-Elysee 1.6", mult:0.85},
  {brand:"BMW", model:"3.20i", mult:1.75},
  {brand:"Mercedes", model:"C 180", mult:1.85},
  {brand:"Suzuki", model:"Swift 1.2", mult:0.75},
  {brand:"Seat", model:"Leon 1.6", mult:1.05}
];
export const COLORS = ["Beyaz","Gri","Siyah","Kırmızı","Lacivert","Gümüş","Bej","Yeşil"];
export const CITIES = ["İstanbul","Ankara","İzmir","Bursa","Kocaeli","Antalya","Gaziantep","Konya","Eskişehir","Mersin"];
// Harita ekranı için gerçek Türkiye ana hatlarıyla orantılı şehir konumları —
// enlem/boylam değerlerinden türetilmiştir (bkz. MapView.js TURKEY_PATH,
// aynı dönüşümle hesaplanmıştır). viewBox "0 0 316 195" üzerinde x/y.
export const CITY_COORDS = {
  "İstanbul": {x:52.5, y:34.7},
  "Ankara": {x:114.6, y:67.1},
  "İzmir": {x:23.2, y:112.4},
  "Bursa": {x:54.0, y:59.6},
  "Kocaeli": {x:67.7, y:41.9},
  "Antalya": {x:80.4, y:158.0},
  "Gaziantep": {x:187.1, y:152.9},
  "Konya": {x:108.7, y:128.9},
  "Eskişehir": {x:77.3, y:71.6},
  "Mersin": {x:143.2, y:161.0}
};
export const TRANS = ["Manuel","Otomatik"];
export const FUEL = ["Benzin","Dizel","LPG'li Benzin","Hibrit"];
export const BODY = ["Sedan","Hatchback","SUV","Station Wagon"];

// Mekanik/elektrik arızaları — boya/değişen parça durumu artık ayrı
// bir sistemle (CAR_PART_DEFS + boya/değişen şeması) yönetiliyor.
export const FAULT_POOL_CAR = [
  {tag:"motor", label:"Motor arızası", loss:[192500,385000], repair:[82500,154000]},
  {tag:"motor", label:"Şanzıman sorunu", loss:[137500,302500], repair:[66000,132000]},
  {tag:"motor", label:"Turbo arızası", loss:[110000,220000], repair:[55000,110000]},
  {tag:"diger", label:"Lastik değişimi gerekiyor", loss:[33000,66000], repair:[27500,49500]},
  {tag:"diger", label:"Fren balatası bitmiş", loss:[22000,49500], repair:[13750,27500]},
  {tag:"diger", label:"Klima çalışmıyor", loss:[27500,60500], repair:[16500,38500]},
  {tag:"diger", label:"Elektrik aksamında arıza", loss:[38500,82500], repair:[22000,49500]},
  {tag:"diger", label:"Cam/ayna kırık", loss:[16500,38500], repair:[8250,19250]},
  {tag:"diger", label:"Akü ve şarj sistemi zayıf", loss:[13750,33000], repair:[8250,16500]}
];
export const HEAVY_FAULT = {tag:"hasar", label:"Ağır hasar kaydı (şasi/kaporta)", loss:[247500,495000], repair:[137500,275000], heavy:true};

// ---- sahibinden.com tarzı boya/değişen parça şeması ----
// Her araç için 11 kaporta parçasının durumu (orijinal / boyalı / değişen)
// ayrı ayrı belirlenir ve detay ekranında şema olarak çizilir.
export const CAR_PART_DEFS = [
  {key:"on-tampon", label:"Ön Tampon"},
  {key:"kaput", label:"Kaput"},
  {key:"tavan", label:"Tavan"},
  {key:"bagaj", label:"Bagaj"},
  {key:"arka-tampon", label:"Arka Tampon"},
  {key:"sol-on-camurluk", label:"Sol Ön Çamurluk"},
  {key:"sag-on-camurluk", label:"Sağ Ön Çamurluk"},
  {key:"sol-on-kapi", label:"Sol Ön Kapı"},
  {key:"sag-on-kapi", label:"Sağ Ön Kapı"},
  {key:"sol-arka-kapi", label:"Sol Arka Kapı"},
  {key:"sag-arka-kapi", label:"Sağ Arka Kapı"}
];
export const PART_STATUS = {
  orijinal: {label:"Orijinal", color:"#c7ccd1"},
  boyali: {label:"Boyalı", color:"#2f6fd6", loss:[16500,38500], repair:[13750,30250]},
  degisen: {label:"Değişen", color:"#d64545", loss:[33000,71500], repair:[24750,52250]}
};

export const CAR_AD_PHRASES = [
  "Tek elden, düzenli bakımlı araçtır.",
  "Garaj kullanımı, özenle kullanılmıştır.",
  "İlk sahibinden, kaza kayıtsız takip edilebilir.",
  "Periyodik bakımları yetkili serviste yapılmıştır.",
  "Takasa ve makul pazarlığa açıktır.",
  "Aracı gören alacaktır, acil satılıktır.",
  "Yeni lastikleri ve akü değişimi mevcuttur.",
  "Ekspertiz raporu ilan sahibinde mevcuttur, talep üzerine paylaşılır.",
  "Hatasız, boyasız, değişensizdir.",
  "Bayi çıkışlı, tüm bakımları faturalıdır.",
  "Ailemin ikinci aracıydı, günlük şehir içi kullanıldı.",
  "Fiyatımda pazarlık payı vardır, ciddi alıcılar arasın."
];

// ---- "hikayeli" satıcı açıklaması — birden fazla parça birleştirilerek
// her ilana kişisel bir anlatı hissi verir ----
export const SELLER_REASONS_CAR = [
  "yurt dışına taşındığım için satıyorum",
  "yeni araca geçtiğim için elden çıkarıyorum",
  "ailede ikinci araca ihtiyaç kalmadığı için satılıktır",
  "iş değişikliği nedeniyle ihtiyacım kalmadı",
  "eşimin aracına geçtik, bu yüzden satılık",
  "nakit ihtiyacından dolayı acil satıyorum",
  "kullanım amacım değişti, daha küçük bir araca bakıyorum",
  "büyükşehre taşındım, araca ihtiyacım kalmadı"
];
export const SELLER_USAGE_CAR = [
  "genelde şehir içi kullandım, uzun yol azdı",
  "hafta sonları dışında pek kullanmadım",
  "işe gidiş geliş dışında bagajda bile bir şey taşımadım",
  "her zaman kapalı otoparkta muhafaza ettim",
  "yılda bir kez genel bakımını ihmal etmedim",
  "sigara içilmedi, evcil hayvan taşınmadı"
];
export const SELLER_CLOSING_CAR = [
  "Ciddi alıcılarla görüşürüm, whatsapp'tan da yazabilirsiniz.",
  "Aracı yerinde görüp inceleyebilirsiniz.",
  "Vekaletle satış da yapılabilir.",
  "Değişik teklif almadan lütfen aramayın.",
  "Kredi ve takas değerlendirilir."
];

export const ARSA_IMAR = ["Konut İmarlı","Ticari İmarlı","Tarla","Bağ-Bahçe","Sanayi İmarlı"];
export const ARSA_ISSUES_POOL = [
  {tag:"tapu", label:"Tapuda ipotek kaydı var", loss:[82500,192500]},
  {tag:"tapu", label:"Haciz şerhi var", loss:[110000,247500]},
  {tag:"yol", label:"Yola cephesi yok", loss:[55000,137500]},
  {tag:"imar", label:"İmar durumu belirsiz / ihtilaflı", loss:[66000,165000]},
  {tag:"tapu", label:"Hisseli tapu (ortaklı)", loss:[99000,176000]},
  {tag:"imar", label:"Deprem riski / zemin etüdü sorunlu", loss:[82500,154000]}
];
export const ARSA_AD_PHRASES = [
  "Yatırımlık, hızla değerlenen bölgede.",
  "Etrafı yapılaşmış, imar durumu net.",
  "Acil nakit ihtiyacından satılıktır.",
  "Tapuda hisseli değil, müstakil parseldir.",
  "Manzaralı, köşe parseldir.",
  "Belediye alt yapı çalışması bölgeye ulaşmıştır.",
  "Miras nedeniyle acil satılıktır.",
  "Toplu konut projelerine yakın konumdadır."
];
export const SELLER_REASONS_ARSA = [
  "miras kalan hisseleri tek elden toplamak için satıyorum",
  "yatırım amaçlı almıştım, farklı bir bölgeye yöneldim",
  "borç kapatmak için acil nakde ihtiyacım var",
  "şehir dışına taşındım, buradaki arazi elimde kaldı",
  "ortaklığı sonlandırıp parselleri ayırıyoruz"
];
export const SELLER_CLOSING_ARSA = [
  "Yerinde gösterilir, harita üzerinden sınırlar net.",
  "Tapu devrinde masraflar paylaşılır.",
  "Ciddi olmayan tekliflere yanıt vermiyorum.",
  "Emlakçı komisyonu alıcıya ait değildir."
];

export const SHOP_TYPES = [
  {type:"galeri", title:"Oto Galerisi", accepts:"araba", capacity:[2,4], rent:[16500,44000], price:[495000,1265000]},
  {type:"emlak", title:"Emlak Ofisi", accepts:"arsa", capacity:[2,3], rent:[13750,33000], price:[330000,990000]}
];
export const DUKKAN_AD_PHRASES = [
  "Demirbaşlarıyla birlikte devren satılıktır.",
  "Kirası uygun, cadde üzeri, yaya trafiği yüksektir.",
  "Sağlık sorunları nedeniyle devredilecektir.",
  "Sabit müşteri potansiyeli mevcuttur.",
  "Tadilata gerek yok, kullanıma hazırdır."
];
export const SELLER_REASONS_DUKKAN = [
  "emekli oluyorum, işi devretmek istiyorum",
  "farklı bir şehre taşınıyoruz",
  "ortaklığı sonlandırıyoruz",
  "sağlık sorunları nedeniyle işi bırakıyorum",
  "yeni bir işe yöneldiğim için devrediyorum"
];

export const AMBIENT_EVENTS = [
  "Piyasada dizel araçlara talep arttı.",
  "Bu hafta arsa fiyatlarında hafif yükseliş var.",
  "Komşu simsar büyük bir SUV sattığını duyurdu.",
  "Yetkili serviste bu hafta yoğunluk var, sıra uzadı.",
  "Bir müşteri galerine uğradı ama eli boş döndü.",
  "Mahalle ustası kahve molasında, iş biraz gecikebilir.",
  "Yedek parça tedarikçisi yeni bir sevkiyat aldı.",
  "Bölgede yeni bir imar planı konuşuluyor.",
  "Bankadan kredi faizleriyle ilgili haber geldi.",
  "Bir tanıdık, aracını senden almak istediğini söyledi.",
  "Kiracı adaylarından biri bölgeni sordu.",
  "Ekspertiz firması yeni bir cihaz aldı, raporlar hızlanacak.",
  "Döviz kurundaki hareket ikinci el fiyatlarını etkiliyor.",
  "Bu ay motorlu taşıtlar vergisi taksidi hatırlatması geldi."
];

// NOT: "Ağır Hasar Onarım Seti" adlı katalog kalemi kaldırıldı — ağır
// hasar/şasi-kaporta tamiri bir raftan alınan "parça" değildir, gerçek
// hayatta olduğu gibi bu tür işler sadece Ustalar/tamirci hizmetiyle
// (işçilik + malzeme birlikte) yapılır.
export const PARTS_CATALOG = [
  {tag:"motor", name:"Motor / Şanzıman Parçası", basePrice:9000},
  {tag:"boya", name:"Kaporta / Boya Malzemesi", basePrice:1800},
  {tag:"diger", name:"Lastik / Fren / Klima Sarfı", basePrice:1100}
];
export const SKILL_LABELS = { tamir:"Tamir Ustalığı", pazarlik:"Pazarlık Ustalığı", ekspertiz:"Ekspertiz Gözü", isletme:"İşletmecilik", sabir:"Sabır" };
export const SKILL_XP_PER_LEVEL = 120;

export const BUYER_NAMES = ["Cem Bey","Selin Hanım","Tolga Bey","Burcu Hanım","İsmail Bey","Nazlı Hanım","Emre Bey","Gül Hanım","Volkan Bey","Aslı Hanım"];

// ---- İlan sahibi kimliği: özel satıcı isimleri + galeri (kurumsal) isimleri ----
// sahibinden.com tarzı kısaltılmış isim gösterimi ("Ahmet Y.") — bireysel
// satıcılar bu havuzdan rastgele bir isim alır.
export const SELLER_NAMES = [
  "Ahmet Y.","Mehmet K.","Ayşe D.","Fatma S.","Mustafa T.","Emine B.",
  "Hüseyin A.","Zeynep C.","Hasan Ö.","Elif M.","Ali R.","Hatice N.",
  "İbrahim F.","Meryem G.","Yusuf P.","Sultan Ş.","Ömer L.","Havva V.",
  "Murat E.","Esra K."
];
// Birden fazla arabayı aynı anda satan sabit galeri (oto bayii) isimleri —
// araba ilanlarının bir kısmı bireysel satıcı yerine bunlardan birine ait
// olur (bkz. Market.makeCar, GALERI_CAR_CHANCE).
export const GALERI_NAMES = [
  "Narin Motorlu Araçlar","Vatan Oto Galeri","Anadolu Otomotiv",
  "Güven Oto Pazarı","Elit Galeri","Best Car İkinci El"
];
export const GALERI_CAR_CHANCE = 0.35;
export const BUYER_DISCOUNT_LINES = [
  "aracınızı/ürününüzü beğendim ama biraz yüksek, {offer} yaparsanız hemen alırım",
  "elimde {offer} nakit var, bugün almak isterim",
  "ilanınızla ilgileniyorum, son fiyatınız {offer} olabilir mi?",
  "bütçem {offer}, üstüne çıkamıyorum ama peşin ödeme yaparım"
];

export const MASRAF_OPTIONS = [
  {id:"tadilat", name:"Tadilat / Yenileme", desc:"Vitrin kapasitesini kalıcı olarak +1 artırır.", cost:80000},
  {id:"reklam", name:"Reklam Panosu", desc:"Vitrindeki ürünlerin günlük kendiliğinden satılma şansını artırır.", cost:25000},
  {id:"demirbas", name:"Demirbaş Yenileme", desc:"Aylık kirayı kalıcı olarak %10 azaltır.", cost:40000},
  {id:"sigorta", name:"İşyeri Sigortası", desc:"Kiracı memnuniyet düşüşlerini yavaşlatır.", cost:30000},
  {id:"egitim", name:"Personel Eğitimi", desc:"Vitrindeki ürünlerin satış fiyatını biraz artırır.", cost:50000}
];
export const TENANT_NAMES = ["Mehmet Usta","Ayşe Hanım","Kemal Bey","Fatma Hanım","Serkan Bey","Elif Hanım","Murat Bey","Zeynep Hanım","Hakan Bey","Derya Hanım"];
export const TENANT_BUSINESS_ARABA = ["Oto Yedek Parça Satışı","İkinci El Oto Alım Satım","Araç Kiralama Ofisi","Oto Yıkama ve Detaylı Bakım"];
export const TENANT_BUSINESS_ARSA = ["Emlak Danışmanlığı","Sigorta Acenteliği","Tapu / Kadastro Danışmanlığı","Peyzaj ve Bahçe Tasarımı"];

export const CAR_QUESTIONS = [
  {key:"hasar", text:"Ağır hasar kaydı var mı?"},
  {key:"motor", text:"Motor ve şanzıman sorunsuz mu?"},
  {key:"boya", text:"Boyalı / değişen parça var mı?"},
  {key:"fiyat", text:"Son fiyat nedir, pazarlık payı var mı?"}
];
export const ARSA_QUESTIONS = [
  {key:"tapu", text:"Tapuda ipotek / haciz var mı?"},
  {key:"yol", text:"Yola cephesi var mı?"},
  {key:"imar", text:"İmar durumu net mi?"},
  {key:"fiyat", text:"Son fiyat nedir, pazarlık payı var mı?"}
];

export const USTALAR = [
  {id:"mahalle", name:"Mahalle Ustası", desc:"Ucuz ama riskli. İşi bazen yarım bırakır.", priceMult:0.55, baseSuccess:0.60, heavyPenalty:0.30, hours:1.5},
  {id:"bilinen", name:"Bildiğim Usta", desc:"Dengeli fiyat, çoğunlukla iş bitirir.", priceMult:1.0, baseSuccess:0.85, heavyPenalty:0.20, hours:3},
  {id:"yetkili", name:"Yetkili Servis", desc:"Pahalı ama garantili iş çıkarır.", priceMult:1.7, baseSuccess:0.97, heavyPenalty:0.10, hours:5}
];

// ---- Arsaya Ev Dikme ----
// Sahip olunan arsaya inşaat başlatılabilir; maliyet m²'ye göre hesaplanır,
// inşaat gün geçişleriyle ilerler ve bittiğinde arsanın değerini belirgin
// biçimde artırır (yatırım getirisi mantığı).
export const CONSTRUCTION_COST_PER_M2 = 18000;
export const CONSTRUCTION_DAYS_MIN = 4;
export const CONSTRUCTION_DAYS_MAX = 7;
export const CONSTRUCTION_VALUE_MULT = 1.7; // inşaat bitince eklenen değer = maliyet × bu çarpan

// ---- Sahip olma masrafları ----
// Garajda bekleyen araç/arsa bedava durmuyor: her gün küçük bir sigorta/
// vergi masrafı çıkar, uzun süre satılmayan ürünler de yavaşça değer
// kaybeder — elinde tutmanın da bir bedeli olsun diye.
export const CAR_DAILY_HOLDING_COST = 150;
export const ARSA_DAILY_HOLDING_COST = 40;
export const STALE_LISTING_DAYS = 10; // bu günden sonra değer kaybı başlar
export const STALE_DEPRECIATION_RATE = 0.004; // günlük ~%0.4

// ---- Fırsat İlanı ----
// Her gün küçük bir ihtimalle piyasada bir ilan normalden çok daha ucuza
// düşer — erken davranan kazanır.
export const DEAL_CHANCE = 0.45;
export const DEAL_DISCOUNT_MIN = 0.18;
export const DEAL_DISCOUNT_MAX = 0.34;

// ---- Ekspertiz riski & TRAMER Kaydı Sorgula ----
// Ekspertiz, aracı fiziksel olarak yerinde inceleyen kapsamlı (ve bu
// yüzden pahalı) bir hizmettir — mekanik/elektrik/boya arızalarını
// ortaya çıkarır ama nadiren bir şeyi gözden kaçırabilir.
// TRAMER ise SBM'nin resmi kaza kaydı sorgusudur: ucuz ve hızlıdır ama
// sadece sigortaya bildirilmiş kazaları gösterir — gerçek hayatta olduğu
// gibi her kaza sigortaya bildirilmez, bu yüzden ağır hasar kayıtlarının
// bir kısmı TRAMER sorgusunda görünmeyebilir (TRAMER_MISS_CHANCE).
export const INSPECT_MISS_CHANCE = 0.08;
export const EKSPERTIZ_BASE_COST = 3500;
export const TRAMER_COST = 300;
export const TRAMER_MISS_CHANCE = 0.30;

// SBM'nin TRAMER sorgu sonucunda gönderdiği SMS'teki kaza tipi kodları.
export const TRAMER_KAZA_TYPES = [
  {code:'KTT', reason:'Carpma'},
  {code:'ERP', reason:'Carpisma'},
  {code:'YKL', reason:'Yan Yatma'},
  {code:'DVL', reason:'Devrilme'},
  {code:'YNG', reason:'Yanma'},
  {code:'SLP', reason:'Selden Etkilenme'}
];

// ---- İlan Doping (Öne Çıkar) ----
// sahibinden.com'un imza özelliği: ücret karşılığında kendi ilanını öne
// çıkarıp alıcı ilgisini geçici olarak artırırsın.
export const BOOST_COST = 1500;
export const BOOST_DAYS = 5;
export const BOOST_ATTRACT_BONUS = 0.18;

// ---- Kasko Sigortası ----
// Sahip olunan araçlar için isteğe bağlı sigorta: günlük küçük bir prim
// karşılığında kaza zararının büyük kısmını karşılar. Dengelendi: kaza
// ihtimali makul sürede fark edilecek kadar sık (KAZA_DAILY_CHANCE), prim
// ucuz, muafiyet ise tipik bir kaza hasarının (FAULT_POOL_CAR loss'ları,
// ~14.000-385.000 TL) çok altında — böylece kasko net ve anlaşılır bir
// risk yönetimi kazanır: ucuz düzenli prim öder, büyük/öngörülemeyen
// hasar riskinden korunursun.
export const KASKO_DAILY_RATE = 0.0003; // aracın güncel değerinin günlük oranı
export const KASKO_MIN_DAILY = 100;
export const KASKO_DEDUCTIBLE = 5000; // muafiyet — sigortalıyken kazada sadece bu ödenir
export const KAZA_DAILY_CHANCE = 0.02;

// ---- İtibar (Satıcı Puanı) ----
// sahibinden'deki satıcı puanı gibi — satış geçmişine göre yıldız
// hesaplanır, alıcı ilgisini ve pazarlık sonuçlarını hafifçe etkiler.
export const REPUTATION_MAX_STARS = 5;

// ---- Harita / Seyahat ----
// Şehirler arası mesafe, CITY_COORDS üzerindeki basit Öklid uzaklığıdır
// (bu koordinatlar doğrudan enlem/boylamdan türetildiği için mesafe birimi
// kabaca gerçek coğrafyayla orantılıdır). Artık iki ayrı seyahat modu var:
// Araba (kendi seyahat aracınla — hızlı ama masraflı, km ekler) ve
// Otobüs (herkese açık, ucuz ama daha uzun sürer, hiçbir aracın km'sini
// etkilemez). Maliyetler hâlâ kasıtlı olarak düşük tutuldu (yakın şehir
// birkaç yüz TL, en uzak şehir bile birkaç bin TL civarı).
export const TRAVEL_CAR_COST_PER_UNIT = 14;
export const TRAVEL_CAR_MIN_COST = 300;
export const TRAVEL_CAR_HOURS_PER_UNIT = 0.055;
export const TRAVEL_BUS_COST_PER_UNIT = 7;
export const TRAVEL_BUS_MIN_COST = 150;
export const TRAVEL_BUS_HOURS_PER_UNIT = 0.13;
// Seyahat aracı olarak seçilmiş bir arabanın km'sinin, kat edilen şematik
// mesafe başına ne kadar artacağı (bkz. Game.doTravel). ~6.5, koordinat
// sistemimizdeki 1 birimlik mesafenin gerçek dünyada kabaca kaç km'ye denk
// geldiğine göre seçildi (örn. İstanbul-Ankara ~70 birim ≈ 455 km).
// Sadece Araba modunda uygulanır — Otobüs modu hiçbir aracın km'sini artırmaz.
export const TRAVEL_KM_PER_UNIT = 6.5;

// ---- Yedek Parçacı fiyat farkı ----
// Her şehirdeki parçacının kendi (gün başına sabit) fiyat çarpanı vardır —
// aynı parça farklı şehirlerde farklı fiyata satılır.
export const PARTS_CITY_VARIANCE_MIN = 0.82;
export const PARTS_CITY_VARIANCE_MAX = 1.28;

// ---- Yedek Parça Kargo ----
// Bulunduğun şehir dışındaki bir parçacıdan parça alınca (İlanlar →
// Yedek Parça, artık tüm şehirler birden gösteriliyor) doğrudan teslim
// edilmez — kargoyla gönderilir. Kargo ücreti mesafeye göre hesaplanır
// ama otobüs biletinden bile ucuzdur (kargonun bütün amacı, o şehre
// gitme masrafından/süresinden tasarruf etmektir); teslimat birkaç
// oyun-içi gün sürer.
export const CARGO_COST_PER_UNIT = 4;
export const CARGO_MIN_COST = 80;
export const CARGO_DELIVERY_DAYS_MIN = 1;
export const CARGO_DELIVERY_DAYS_MAX = 3;
// ---- Depo / garaj kapasitesi ----
// Başlangıçta oyuncunun sınırlı araç ve yedek parça depolama alanı vardır.
// Galeri satın alındığında o galerinin kapasitesi toplam araç depolamaya eklenir.
export const START_GARAGE_CAPACITY = 3;
export const START_PARTS_CAPACITY = 10;

// ---- Günlük Yaşam Maliyeti / Ev Kirası / Pansiyon ----
// Sahip olma masraflarından (CAR_DAILY_HOLDING_COST vb.) bağımsız, kişisel
// giderler: oyuncunun kendisi de her gün yemek/fatura gibi bir yaşam
// maliyetine katlanır, ayrıca bir "ev şehri" (Player.homeCity, oyun
// başında İstanbul olarak sabitlenir, seyahatle değişmez) için sabit bir
// kira öder — bu, nerede olursa olsun her gün ödenir. Oyuncu ev şehrinin
// VE sahip olduğu hiçbir dükkanın şehrinde değilse (yani seyahatteyse ve
// kalacak bir yeri yoksa), buna ek olarak ucuz bir pansiyon/otel masrafı
// eklenir — uzun otobüs yolculukları bu yüzden ekstra pansiyon günü
// biriktirebilir.
export const DAILY_LIVING_COST = 300;
export const DAILY_RENT = 450;
export const PANSIYON_DAILY_COST = 600;
