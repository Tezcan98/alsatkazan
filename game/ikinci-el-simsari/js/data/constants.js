// =====================================================================
//  VERİ TANIMLARI (sabit havuzlar)
// =====================================================================

// Türkiye piyasasına yakın olması için tüm baz fiyatlar bu çarpanla
// ölçekleniyor — kaynak sayılar okunabilir kalsın diye "gerçekçi 2020
// öncesi" seviyede yazılıp sc()/scR() ile büyütülüyor. Dengeyi değiştirmek
// için tek yapılması gereken PRICE_SCALE'i güncellemek.
export const PRICE_SCALE = 5.5;
function sc(n){ return Math.round(n*PRICE_SCALE); }
function scR(r){ return [sc(r[0]), sc(r[1])]; }

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
export const TRANS = ["Manuel","Otomatik"];
export const FUEL = ["Benzin","Dizel","LPG'li Benzin","Hibrit"];
export const BODY = ["Sedan","Hatchback","SUV","Station Wagon"];

// Mekanik/elektrik arızaları — boya/değişen parça durumu artık ayrı
// bir sistemle (CAR_PART_DEFS + boya/değişen şeması) yönetiliyor.
export const FAULT_POOL_CAR = [
  {tag:"motor", label:"Motor arızası", loss:scR([35000,70000]), repair:scR([15000,28000])},
  {tag:"motor", label:"Şanzıman sorunu", loss:scR([25000,55000]), repair:scR([12000,24000])},
  {tag:"motor", label:"Turbo arızası", loss:scR([20000,40000]), repair:scR([10000,20000])},
  {tag:"diger", label:"Lastik değişimi gerekiyor", loss:scR([6000,12000]), repair:scR([5000,9000])},
  {tag:"diger", label:"Fren balatası bitmiş", loss:scR([4000,9000]), repair:scR([2500,5000])},
  {tag:"diger", label:"Klima çalışmıyor", loss:scR([5000,11000]), repair:scR([3000,7000])},
  {tag:"diger", label:"Elektrik aksamında arıza", loss:scR([7000,15000]), repair:scR([4000,9000])},
  {tag:"diger", label:"Cam/ayna kırık", loss:scR([3000,7000]), repair:scR([1500,3500])},
  {tag:"diger", label:"Akü ve şarj sistemi zayıf", loss:scR([2500,6000]), repair:scR([1500,3000])}
];
export const HEAVY_FAULT = {tag:"hasar", label:"Ağır hasar kaydı (şasi/kaporta)", loss:scR([45000,90000]), repair:scR([25000,50000]), heavy:true};

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
  orijinal: {label:"Orijinal", color:"#9aa4ad"},
  boyali: {label:"Boyalı", color:"#e0980a", loss:scR([3000,7000]), repair:scR([2500,5500])},
  degisen: {label:"Değişen", color:"#c62828", loss:scR([6000,13000]), repair:scR([4500,9500])}
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
  {tag:"tapu", label:"Tapuda ipotek kaydı var", loss:scR([15000,35000])},
  {tag:"tapu", label:"Haciz şerhi var", loss:scR([20000,45000])},
  {tag:"yol", label:"Yola cephesi yok", loss:scR([10000,25000])},
  {tag:"imar", label:"İmar durumu belirsiz / ihtilaflı", loss:scR([12000,30000])},
  {tag:"tapu", label:"Hisseli tapu (ortaklı)", loss:scR([18000,32000])},
  {tag:"imar", label:"Deprem riski / zemin etüdü sorunlu", loss:scR([15000,28000])}
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
  {type:"galeri", title:"Oto Galerisi", accepts:"araba", capacity:[2,4], rent:scR([3000,8000]), price:scR([90000,230000])},
  {type:"emlak", title:"Emlak Ofisi", accepts:"arsa", capacity:[2,3], rent:scR([2500,6000]), price:scR([60000,180000])}
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

export const PARTS_CATALOG = [
  {tag:"motor", name:"Motor / Şanzıman Parçası", basePrice:sc(8000)},
  {tag:"boya", name:"Kaporta / Boya Malzemesi", basePrice:sc(2500)},
  {tag:"diger", name:"Lastik / Fren / Klima Sarfı", basePrice:sc(1800)},
  {tag:"hasar", name:"Ağır Hasar Onarım Seti", basePrice:sc(15000)}
];
export const SKILL_LABELS = { tamir:"Tamir Ustalığı", pazarlik:"Pazarlık Ustalığı", ekspertiz:"Ekspertiz Gözü", isletme:"İşletmecilik", sabir:"Sabır" };
export const SKILL_XP_PER_LEVEL = 120;

export const BUYER_NAMES = ["Cem Bey","Selin Hanım","Tolga Bey","Burcu Hanım","İsmail Bey","Nazlı Hanım","Emre Bey","Gül Hanım","Volkan Bey","Aslı Hanım"];
export const BUYER_DISCOUNT_LINES = [
  "aracınızı/ürününüzü beğendim ama biraz yüksek, {offer} yaparsanız hemen alırım",
  "elimde {offer} nakit var, bugün almak isterim",
  "ilanınızla ilgileniyorum, son fiyatınız {offer} olabilir mi?",
  "bütçem {offer}, üstüne çıkamıyorum ama peşin ödeme yaparım"
];

export const MASRAF_OPTIONS = [
  {id:"tadilat", name:"Tadilat / Yenileme", desc:"Vitrin kapasitesini kalıcı olarak +1 artırır.", cost:sc(15000)},
  {id:"reklam", name:"Reklam Panosu", desc:"Vitrindeki ürünlerin günlük kendiliğinden satılma şansını artırır.", cost:sc(5000)},
  {id:"demirbas", name:"Demirbaş Yenileme", desc:"Aylık kirayı kalıcı olarak %10 azaltır.", cost:sc(8000)},
  {id:"sigorta", name:"İşyeri Sigortası", desc:"Kiracı memnuniyet düşüşlerini yavaşlatır.", cost:sc(6000)},
  {id:"egitim", name:"Personel Eğitimi", desc:"Vitrindeki ürünlerin satış fiyatını biraz artırır.", cost:sc(10000)}
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

export const INSPECT_RATE = 0.02;
export const MIN_INSPECT = sc(400);

// ---- Banka Kredisi ----
// Kontrol Paneli → Profil altından çekilebilen sabit tutarlı krediler;
// her gün geçişinde faiz işler ve otomatik asgari ödeme düşülür.
export const LOAN_TIERS = [
  { amount: sc(200000), dailyRate: 0.018, dailyPaymentRate: 0.07 },
  { amount: sc(500000), dailyRate: 0.022, dailyPaymentRate: 0.065 },
  { amount: sc(1000000), dailyRate: 0.026, dailyPaymentRate: 0.06 }
];

// ---- Arsaya Ev Dikme ----
// Sahip olunan arsaya inşaat başlatılabilir; maliyet m²'ye göre hesaplanır,
// inşaat gün geçişleriyle ilerler ve bittiğinde arsanın değerini belirgin
// biçimde artırır (yatırım getirisi mantığı).
export const CONSTRUCTION_COST_PER_M2 = sc(3500);
export const CONSTRUCTION_DAYS_MIN = 4;
export const CONSTRUCTION_DAYS_MAX = 7;
export const CONSTRUCTION_VALUE_MULT = 1.7; // inşaat bitince eklenen değer = maliyet × bu çarpan
