// =====================================================================
//  VERİ TANIMLARI (sabit havuzlar)
// =====================================================================
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

export const FAULT_POOL_CAR = [
  {tag:"motor", label:"Motor arızası", loss:[35000,70000], repair:[15000,28000]},
  {tag:"motor", label:"Şanzıman sorunu", loss:[25000,55000], repair:[12000,24000]},
  {tag:"motor", label:"Turbo arızası", loss:[20000,40000], repair:[10000,20000]},
  {tag:"boya", label:"Boyalı kaput", loss:[8000,18000], repair:[4000,9000]},
  {tag:"boya", label:"Değişen kapı", loss:[10000,20000], repair:[5000,11000]},
  {tag:"boya", label:"Değişen tampon", loss:[6000,14000], repair:[3000,7000]},
  {tag:"diger", label:"Lastik değişimi gerekiyor", loss:[6000,12000], repair:[5000,9000]},
  {tag:"diger", label:"Fren balatası bitmiş", loss:[4000,9000], repair:[2500,5000]},
  {tag:"diger", label:"Klima çalışmıyor", loss:[5000,11000], repair:[3000,7000]},
  {tag:"diger", label:"Elektrik aksamında arıza", loss:[7000,15000], repair:[4000,9000]},
  {tag:"diger", label:"Cam/ayna kırık", loss:[3000,7000], repair:[1500,3500]},
  {tag:"diger", label:"Akü ve şarj sistemi zayıf", loss:[2500,6000], repair:[1500,3000]}
];
export const HEAVY_FAULT = {tag:"hasar", label:"Ağır hasar kaydı (şasi/kaporta)", loss:[45000,90000], repair:[25000,50000], heavy:true};

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

export const ARSA_IMAR = ["Konut İmarlı","Ticari İmarlı","Tarla","Bağ-Bahçe","Sanayi İmarlı"];
export const ARSA_ISSUES_POOL = [
  {tag:"tapu", label:"Tapuda ipotek kaydı var", loss:[15000,35000]},
  {tag:"tapu", label:"Haciz şerhi var", loss:[20000,45000]},
  {tag:"yol", label:"Yola cephesi yok", loss:[10000,25000]},
  {tag:"imar", label:"İmar durumu belirsiz / ihtilaflı", loss:[12000,30000]},
  {tag:"tapu", label:"Hisseli tapu (ortaklı)", loss:[18000,32000]},
  {tag:"imar", label:"Deprem riski / zemin etüdü sorunlu", loss:[15000,28000]}
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

export const SHOP_TYPES = [
  {type:"galeri", title:"Oto Galerisi", accepts:"araba", capacity:[2,4], rent:[3000,8000], price:[90000,230000]},
  {type:"emlak", title:"Emlak Ofisi", accepts:"arsa", capacity:[2,3], rent:[2500,6000], price:[60000,180000]}
];
export const DUKKAN_AD_PHRASES = [
  "Demirbaşlarıyla birlikte devren satılıktır.",
  "Kirası uygun, cadde üzeri, yaya trafiği yüksektir.",
  "Sağlık sorunları nedeniyle devredilecektir.",
  "Sabit müşteri potansiyeli mevcuttur.",
  "Tadilata gerek yok, kullanıma hazırdır."
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
  "Ekspertiz firması yeni bir cihaz aldı, raporlar hızlanacak."
];

export const PARTS_CATALOG = [
  {tag:"motor", name:"Motor / Şanzıman Parçası", basePrice:8000},
  {tag:"boya", name:"Kaporta / Boya Malzemesi", basePrice:2500},
  {tag:"diger", name:"Lastik / Fren / Klima Sarfı", basePrice:1800},
  {tag:"hasar", name:"Ağır Hasar Onarım Seti", basePrice:15000}
];
export const SKILL_LABELS = { tamir:"Tamir Ustalığı", pazarlik:"Pazarlık Ustalığı", ekspertiz:"Ekspertiz Gözü", isletme:"İşletmecilik" };
export const SKILL_XP_PER_LEVEL = 120;

export const MASRAF_OPTIONS = [
  {id:"tadilat", name:"Tadilat / Yenileme", desc:"Vitrin kapasitesini kalıcı olarak +1 artırır.", cost:15000},
  {id:"reklam", name:"Reklam Panosu", desc:"Vitrindeki ürünlerin günlük kendiliğinden satılma şansını artırır.", cost:5000},
  {id:"demirbas", name:"Demirbaş Yenileme", desc:"Aylık kirayı kalıcı olarak %10 azaltır.", cost:8000},
  {id:"sigorta", name:"İşyeri Sigortası", desc:"Kiracı memnuniyet düşüşlerini yavaşlatır.", cost:6000},
  {id:"egitim", name:"Personel Eğitimi", desc:"Vitrindeki ürünlerin satış fiyatını biraz artırır.", cost:10000}
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
export const MIN_INSPECT = 400;
