# ML Yolu

`mufredat/ders-ml-yol.json` dosyasını okuyan statik çalışma sitesi. Müfredatı
yeniden yazmaz; 32 ünite, 110 ders, 991 sayfa ve 655 sözlük terimini olduğu gibi
gösterir, üstüne okuma sırası, haftalık plan ve cihazda kalan ilerleme ekler.

## Ne var?

- **Ağ / yol haritası** — 6 hat, 32 durak; her durak bir ünite. Duraklar üniteye,
  dersler tek tek sayfalara gider.
- **Ders sayfası** — yazarın sayfa ritmi korunur: anlatım, kod, pratik, kontrol
  (cevap kapalı), özet. Formüller KaTeX, kod Shiki ile basılır. Kod bloğunu
  kopyalama düğmesi vardır.
- **Plan** — başlangıç tarihi ve haftalık saatten haftalık çizelge üretir. İki mod:
  dosya sırası (ardışık) ve paralel mod. Paralel modda Başlangıç+Araçlar tek hat
  ilerler; F1’e geçince F0 matematiği haftanın ~1/3’ünü alır. Proje dersleri
  haftalara bölünür. Haftalık süre derslerin kendi `minutes` değerinden gelir.
- **Sözlük** — 655 terim, harf ve metin filtresi, formüllü tanımlar, `seeAlso`
  bağlantıları. Ders içindeki noktalı terim bağlantısı yan panelde tanım açar.
- **Arama** — derleme sırasında Pagefind ile üretilen tam metin dizini. Kod
  blokları, formüller ve kontrol cevapları dizin dışında tutulur.
- **İlerleme** — “Dersi tamamladım” yalnız `localStorage` içinde (`mlyol.v1`)
  saklanır. Hesap, sunucu, çerez ve analitik yoktur.
- Koyu/açık tema, yazdırma düzeni, klavye kısayolu (`/` arama, `Esc` panel/menü).

## Çalıştırma

Gereken: Node.js >= 22.23.4.

```bash
npm install
npm run dev        # http://localhost:4321
```

Üretim çıktısı ve arama dizini:

```bash
npm run build      # doğrula → astro build → pagefind → çıktı denetimi
npm run preview
```

`npm run build` üç denetim çalıştırır:

1. `scripts/validate.mjs` — kaynak JSON: kimlik tekilliği, sayfa türleri, kontrol
   cevapları, `term:` bağlantılarının sözlükte karşılığı.
2. `scripts/check-dist.mjs` — çıktı: 110 ders, 991 sayfa, 334 cevap, 655 terim,
   KaTeX hatası 0, gerekli dosyalar.
3. Pagefind dizini.

Arama yalnız üretim çıktısında bulunur; `npm run dev` sırasında arama sayfası
“dizin bulunamadı” der. Bunun yerine `npm run build && npm run preview` kullan.

## Veri

Tek içerik kaynağı `data/course.json` (kopyası
`/Users/mby/Desktop/proje/mufredat/ders-ml-yol.json`). Beklenen biçim:

```json
{
  "type": "course",
  "version": 1,
  "areas": [{
    "id": "ml-yol",
    "title": "…",
    "glossary": [{ "id": "…", "term": "…", "en": "…", "short": "…", "md": "…", "seeAlso": ["…"] }],
    "units": [{
      "id": "…", "title": "…",
      "lessons": [{ "id": "…", "title": "…", "minutes": 75,
        "pages": [{ "id": "…", "kind": "text|code|check|summary", "md": "…", "answer": "…" }] }]
    }]
  }]
}
```

Güncelleme: dosyayı değiştir, `npm run build`. Mevcut hatlardaki yeni üniteler
ve dersler kimliklerden otomatik türer; ayrıca rota yazmak gerekmez. Hat
eşlemesi ünite kimliğinin ön ekine dayanır: `u0-*` başlangıç, `a*` araçlar,
`f0-*`–`f3-*` fazlar. F4 gibi yeni bir faz eklenirse `src/lib/course.ts`
içindeki `PHASE_DEFS` ve `--line-f4` rengi eklenmeli; aksi halde derleme
eşlenmeyen ünite hatasıyla durur (sessizce ders kaybetmez).

Site yalnız dosyada olanı gösterir. JSON’da F4–F6 üniteleri yoktur; site bunları
üretmez, “Hakkında” sayfasında eksik olarak listeler.

## GitHub Pages

Yayın adresi: <https://mby19.github.io/ml-yol/>. Site, derlenmiş çıktının
`gh-pages` dalına itilmesiyle yayınlanır (Jekyll kapalı: `public/.nojekyll`).

Güncelleme için:

```bash
./scripts/deploy-pages.sh
```

Betik `BASE_PATH` ve `SITE_URL` değerlerini depo adından türetir, `npm run build`
çalıştırır ve `dist/` içeriğini `gh-pages` dalına gönderir. Farklı bir alan adı
için:

```bash
SITE_URL=https://ornek.com BASE_PATH=/ ./scripts/deploy-pages.sh
```

Actions ile otomatik dağıtım isteğe bağlıdır: `.github/workflows` altına bir
workflow eklemek, GitHub token'ında `workflow` scope'u gerektirir. Bu depo
workflow scope'u olmayan oturumda branch dağıtımıyla yayınlandı.

## Yapı

```
data/course.json          içerik (tek kaynak)
scripts/validate.mjs      kaynak denetimi
scripts/check-dist.mjs    çıktı denetimi
src/lib/course.ts         ünite/ders/hat modeli, sayımlar
src/lib/markdown.ts       markdown → HTML, KaTeX, Shiki, terim bağlantıları
src/lib/glossary.ts       sözlük HTML önbelleği
src/layouts/BaseLayout    kabuk, tema, gezinme, sözlük paneli
src/pages/index.astro     yol haritası / ağ
src/pages/hat/[key]       faz hattı
src/pages/unite/[id]      ünite ve ders listesi
src/pages/ders/[id]       ders sayfası
src/pages/plan.astro      haftalık plan
src/pages/sozluk.astro    sözlük
src/pages/sozluk/veri.json.ts  sözlük paneli verisi
src/pages/arama.astro     Pagefind arayüzü
src/scripts/*             ilerleme, plan, arama, sözlük, tema
src/styles/global.css     tasarım sistemi
```

## Tasarım notu

Görsel dil bir toplu taşıma ağı: hat renkleri, durak kodları, sefer tarifesi
mantığı. Ders/ünite/hat sayfaları solid hat rengi bir istasyon başlığıyla
açılır; ünite dersleri dikey hat üzerinde durak daireleri olarak dizilir; plan
özeti altı renkli çizgili bir kalkış tahtasıdır. Ana başlıkta “Yolu” serif
italik, gövde Source Serif, gezinme/sayılar Archivo, kod mono. Amaç süs değil
yön bulma; renkli alanlarda metin beyaz ve en düşük kontrast 5,36:1.
