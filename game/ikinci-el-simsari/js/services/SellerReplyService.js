// =====================================================================
//  SATICI YANIT SERVİSİ — serbest metin mesajlara yapay zeka (Gemini)
//  entegrasyonu için ayrılmış yer tutucu servis
// =====================================================================
// Oyuncu ilan sahibine hazır soru çiplerinin dışında serbest metin de
// yazabiliyor (bkz. MesajlarView "Mesaj yaz" alanı). Hazır sorular hâlâ
// GameController.askQuestion içindeki basit kural tabanlı mantıkla yanıt
// alıyor; serbest metin mesajlar için ise buradaki fonksiyon çağrılıyor.
//
// STUB: Şu an gerçek bir LLM (Gemini) çağrısı YAPILMIYOR — bu, ileride
// gerçek bir Gemini API entegrasyonunun bağlanacağı tek nokta. Şimdilik
// hiçbir ağ isteği atmadan, hiçbir yanıt üretmeden null döner; böylece
// oyuncunun serbest yazdığı mesaj satıcı tarafından "görülmemiş" gibi
// sessiz kalır.
export function generateSellerReply(message, item){
  // TODO(gelecek): burada Gemini API'sine (item bağlamı + message ile)
  // bir istek atılıp satıcının doğal dil yanıtı üretilecek. Şimdilik stub.
  return null;
}
