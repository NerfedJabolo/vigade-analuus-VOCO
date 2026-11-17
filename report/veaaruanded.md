---
title: "Veebirakenduste Piletilevi ja Elisa analüüs"
subtitle: "Veaaruanded, tõendid ja parandusettepanekud"
date: "17.11.2026"
lang: et
---

| Väli | Väärtus |
|---|---|
| Testitavad rakendused | Piletilevi (<https://www.piletilevi.ee>), Elisa (<https://www.elisa.ee>) |
| Testimise kuupäev | 17.11.2026 |
| Testija | Sten |
| Keskkond | Chromium 158, Playwright 1.65, Linux, 1440 × 900 ja 375 × 812 |
| Dokumendi versioon | 1.0 |
| Tulemus | 11 defekti: 5 × P2, 4 × P3, 2 × P4 |

**Raporti eesmärk.** Dokumenteerida kahe avaliku veebirakenduse testimisel leitud defektid nii, et teine testija saaks need samadel tingimustel taastoota, ning pakkuda iga defekti jaoks konkreetne parandus.

**Sisukord**

1. Kokkuvõte
2. Metoodika ja keskkond
3. Prioriteediskaala
4. Rakendus 1: Piletilevi
5. Rakendus 2: Elisa
6. Täiendavad tähelepanekud
7. Soovitused ja parandusplaan
8. Lisad A–C (tõendid, skriptid, piirangud)

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# Kokkuvõte

Käesolev raport dokumenteerib kahe avaliku Eesti veebirakenduse – **Piletilevi** (<https://www.piletilevi.ee>) ja **Elisa** (<https://www.elisa.ee>) – testimise 17.11.2026. Rakendused valiti teadlikult nii, et neid ei olnud käesolevas tööruumis varem testitud.

Testimine keskendus neljale valdkonnale:

1. **Funktsionaalsus** – otsing, filtrid, piletikoguse valik, uudiskiri ja tooteleht.
2. **Klaviatuuriga kasutatavus** – Tab-järjekord, Enteri käitumine, skip-link.
3. **Ligipääsetavus** – ligipääsetavad nimed, rollid, olekud ja veateadete teatamine ekraanilugejale.
4. **HTML-i ja SEO kvaliteet** – pealkirjad, `title`, duplikaatsed ID-d ja katkised ressursid.

Kokku leiti ja taastoodeti **11 defekti**: 5 Piletilevis ja 6 Elisas. Kriitilise ehk P1 tasemega defekte ei leitud. Jaotus: **5 × P2, 4 × P3, 2 × P4**.

| Rakendus | URL | Defekte | P2 | P3 | P4 | Suurim risk |
|---|---|--:|--:|--:|--:|---|
| Piletilevi | <https://www.piletilevi.ee> | 5 | 2 | 1 | 2 | Ekraanilugeja ei tunne ostukorvi ega karusselli juhtnuppe; uudiskirja viga ei pruugi olla teatatud |
| Elisa | <https://www.elisa.ee> | 6 | 3 | 3 | 0 | Enter ei käivita otsingut; skip-link ja otsingu combobox-semantika on katki |
| **Kokku** |  | **11** | **5** | **4** | **2** |  |

Peamised järeldused:

- Suurim mõju on **klaviatuuri- ja ekraanilugejakasutajatel**: Piletilevi nimeta ikoonnupud (PL-01), Elisa katkine skip-link (EL-02) ja Elisa otsingu Enter-käitumine (EL-01) blokeerivad või raskendavad põhiteekonda.
- Elisa otsingu autocomplete on visuaalselt olemas, kuid **programmiliselt nähtamatu** (EL-06): soovitusi ei eksponeerita `combobox`/`listbox` semantikaga.
- Elisa tootelehtedel on **sisuline ja SEO defekt** (EL-03, EL-04): puudub `h1` ja `title` on kõigil toodetel üldine.
- Piletilevi väiksemad defektid (PL-03…PL-05) ei blokeeri ostu, kuid tekitavad segadust ja raskendavad monitooringut.

# Metoodika ja keskkond

| Väli | Väärtus |
|---|---|
| Testitavad rakendused | Piletilevi (<https://www.piletilevi.ee>), Elisa (<https://www.elisa.ee>) |
| Testimise kuupäev | 17.11.2026 |
| Testija | Sten |
| Brauser | Chromium 158 (Chrome for Testing), Playwright 1.65 |
| Operatsioonisüsteem | Linux |
| Vaateavad | 1440 × 900 (desktop) ja 375 × 812 (mobiil) |
| Keel/lokaal | `et-EE` |
| Meetod | Uuriv testimine, scriptitud taastootmine, CDP `Accessibility.getFullAXTree`, konsooli- ja võrgulogid, WCAG 2.2 AA heuristika |
| Testandmed | `abc` (vale e-post), `a` (ühemärgiline otsing), `TEST123` (vale sooduskood) |
| Piirangud | Avalikud lehed; ei toimunud sisselogimist, ostu ega andmete muutmist. Produktsioonikeskkond võib pärast 17.11.2026 muutuda. |

**Eetika ja ohutus.** Testiti ainult avalikke lehti. Uudiskirja vormile sisestati teadlikult vale e-post (`abc`), mis ei tekita tellimust. Sooduskoodi väljale sisestati olematu kood (`TEST123`). Ostukorvi ega makseprotsessi ei läbitud. Ekraanipiltidel võib esineda kolmandate osapoolte reklaame; need ei ole raporti osa.

**Taastootmine.** Iga defekti jaoks on salvestatud ekraanipilt ja/või masinloetav logi kaustas `evidence/`. Skriptid asuvad kaustas `scripts/` ja on korratavad käsuga `node scripts/capture-evidence.js` (nõuab Playwrighti ja Chromiumi). Tõendite täpne loetelu on lisas A.

# Prioriteediskaala

| Prioriteet | Tähendus | Reageerimisaeg |
|---|---|---|
| **P1 – kriitiline** | Põhifunktsioon ei tööta, tekib andmekadu või turvarisk. | Kohe |
| **P2 – kõrge** | Oluline kasutajateekond või ligipääsetavus on katki; mõjutab paljusid kasutajaid. | Järgmises sprintis |
| **P3 – keskmine** | Mõjutab osa kasutajaid, SEO-d või kasutuskogemust; ajutine lahendus olemas. | Planeeritult |
| **P4 – madal** | Kosmeetiline või tehniline ebatäpsus, väike kasutajamõju. | Hooldustööna |

Tõsiduse ja prioriteedi eristus: tõsidus kirjeldab mõju suurust, prioriteet lisab ärilise kiireloomulisuse. Käesolevas raportis on need kokku langenud, sest kõik leitud defektid on avalikud ja parandatavad ilma suurema arhitektuurimuudatuseta.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Rakendus 1: Piletilevi

## Ülevaade

Piletilevi on Eesti piletimüügiplatvorm, mille avaleht koondab kampaaniat, otsingu, kategooriad, sündmuste karussellid ja uudiskirja. Testimise fookus:

- päise ostukorv ja kontonavigatsioon;
- karussellide juhtimine;
- otsingu käitumine ja tagasiside;
- sündmuselehe piletikoguse valik;
- otsingutulemuste kuupäevafilter;
- uudiskirja vormi valideerimine.

Kokku leiti **5 defekti**: 2 P2, 1 P3 ja 2 P4.

## Veaaruannete koondtabel

| Defekti ID | Kirjeldus | Taastootmise sammud | Eeldatav tulemus | Tegelik tulemus | Prioriteet | Lahendus | Testimise kuupäev | Testija |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| PL-01 | Päise ostukorvi ikoonlink ja karussellide eelmine/järgmine nupud on ilma teksti ja `aria-label`-ita; AX-nimi on tühi. | 1) Ava avaleht. 2) Liigu Tab-iga päisesse ja karusselli. 3) Ava DevTools → Accessibility. | Nimi „Ostukorv“, „Eelmine slaid“, „Järgmine slaid“. | AX `name=""`, `aria-label` puudub; 8 nimeta karussellinuppu. | P2 | Lisa `aria-label`; dekoorikoonile `aria-hidden="true"`; eemalda tühjad pildilingid. | 17.11.2026 | Sten |
| PL-02 | Uudiskirja vale e-posti korral jääb fookus „Liitun“ nupule; veateatel puudub `role="alert"`/`aria-live`. | 1) Keri uudiskirja juurde. 2) Sisesta `abc`. 3) Vajuta „Liitun“. | Fookus liigub e-posti väljale või veateade teatatakse live-regiooniga. | `activeElement=BUTTON "Liitun"`; `#v-0-4-1-error` `role=null`, `aria-live=null`. | P2 | Lisa `role="alert"` ja fookuse juhtimine; kasuta `type="email"`. | 17.11.2026 | Sten |
| PL-03 | Ühemärgiline otsing („a“) ei käivita otsingut ega anna vihjet. | 1) Ava avaleht. 2) Sisesta otsingusse `a`. 3) Vajuta Enter. | Tulemused või teade „Sisesta vähemalt 2 tähemärki“. | URL jääb `https://www.piletilevi.ee/`; ühtegi teadet ei kuvata. | P3 | Valideeri pikkus enne päringut ja kuva inline-vihje; teata see `aria-live`-ga. | 17.11.2026 | Sten |
| PL-04 | Piletikoguse „−“ nupp on koguse 0 juures aktiivne, kuid ei muuda kogust. | 1) Ava sündmuseleht. 2) Keri „Piletite valimine“ juurde. 3) Klõpsa „−“ koguse 0 juures. | Nupp on `disabled` või peidetud, kuni kogus on > 0. | `disabled=false`; kogus jääb 0. | P4 | `:disabled="qty === 0"` ja `aria-disabled`; sünkrooni visuaalne olek. | 17.11.2026 | Sten |
| PL-05 | Kuupäevafiltri „Täna“ rakendamisel tekib URL-i duplikaatne `date` parameeter. | 1) Otsi „kontsert“. 2) Ava „Toimumise aeg“ → „Täna“. 3) Vajuta „Näita“. 4) Vaata URL-i. | Üks `date=2026-11-17` parameeter. | `date=2026-11-17&date=2026-11-17`. | P4 | Kasuta `URLSearchParams.set` või dedupe enne `router.push`-i. | 17.11.2026 | Sten |

## PL-01 — Ostukorvi ikoonlink ja karusselli nooled on nimeta

**Kirjeldus.** Päise ostukorv on ikoonlink (`a[data-cy="shopping-cart"]`), millel ei ole nähtavat teksti ega `aria-label`-it. Sama kehtib karussellide eelmine/järgmine nuppude kohta: lehel on kaheksa nähtavat noolenuppu, mille ligipääsetav nimi on tühi. Ekraanilugeja kasutaja kuuleb ainult „link“ või „nupp“ ega tea, mida see teeb.

**Taastootmine.**

1. Ava <https://www.piletilevi.ee/> ja nõustu küpsistega.
2. Vajuta Tab ja liigu päise lingini või ava DevTools → Accessibility.
3. Vaata karusselli vasakut ja paremat noolt lehe keskel.
4. Kontrolli AX-puust `link`/`button` nimesid.

**Eeldatav tulemus.** Ostukorv on nimetatud „Ostukorv“ (soovitavalt koos toodete arvuga) ning nooled „Eelmine slaid“ ja „Järgmine slaid“.

**Tegelik tulemus.** Ostukorvil on `aria-label=null` ja tekst tühi; noolenuppudel `aria-label=null`. AX-puus on 26 nimeta linki/nuppu, sealhulgas 8 karussellinuppu.

**Prioriteet: P2.** Mõjutab otseselt ekraanilugeja ja klaviatuuriga navigeerijaid; ostukorv on üks olulisemaid sihtkohti.

**Lahendus.** Lisa igale ikoonnupule/lingile ligipääsetav nimi ja peida dekoratiivne ikoon ekraanilugeja eest.

```html
<a href="/checkout" data-cy="shopping-cart" aria-label="Ostukorv">
  <span class="iconify i-plg:shopping-cart" aria-hidden="true"></span>
</a>

<button id="button-prev402" aria-label="Eelmine slaid">
  <span class="iconify i-plg:arrow-left" aria-hidden="true"></span>
</button>
<button id="button-next402" aria-label="Järgmine slaid">
  <span class="iconify i-plg:arrow-right" aria-hidden="true"></span>
</button>
```

Pikemas perspektiivis: lisada komponendikontroll (Storybook/Playwright + axe), mis nõuab, et igal `button`-il ja `a`-l oleks mitte-tühi ligipääsetav nimi.

**Tõend.** Punasega on tähistatud ostukorv ja karusselli nooled; tõendiloost `PL-01-clean.json` nähtub, et `aria` on `null` ja noolenuppe on 8.

![PL-01 tõend: punasega on tähistatud nimeta ostukorv ja karusselli nooled.](evidence/annotated/PL-01.png){width=22cm}

```text
AX role=link name="" url=https://www.piletilevi.ee/checkout
AX role=button name="" (button-prev402)
AX role=button name="" (button-next402)
... kokku 8 nimeta karussellinuppu
```

## PL-02 — Uudiskirja viga ei ole ekraanilugejale teatatud

**Kirjeldus.** Vale e-posti sisestamisel kuvatakse punane veateade ja väljale seatakse `aria-invalid="true"`, kuid fookus jääb „Liitun“ nupule. Veateate elemendil puudub `role="alert"` või `aria-live`, seega ekraanilugeja ei pruugi veast teada. Lisaks on e-posti väli `type="text"`, mitte `type="email"`, mistõttu mobiilne klaviatuur ja brauseri natiivne valideerimine ei toeta.

**Taastootmine.**

1. Ava <https://www.piletilevi.ee/> ja nõustu küpsistega.
2. Keri lehe lõppu uudiskirja „Uudiskirjaga liitumine“ juurde.
3. Sisesta e-posti väljale `abc` ja vajuta „Liitun“.
4. Kontrolli DevToolsis `document.activeElement`-i ja veateate elemendi atribuute.

**Eeldatav tulemus.** Fookus liigub vigasele väljale või veateade teatatakse `role="alert"`/`aria-live` kaudu; väli on `type="email"`.

**Tegelik tulemus.** `activeElement` on `BUTTON` tekstiga „Liitun“; veateatel `#v-0-4-1-error` on `role=null` ja `aria-live=null`; input on `type="text"`, kuigi `aria-invalid="true"` ja `aria-describedby="v-0-4-1-error"` on õigesti seatud.

**Prioriteet: P2.** Vormi valideerimine on olemas, kuid selle tulemus ei jõua ekraanilugeja kasutajani; tegu on WCAG 3.3.1 ja 4.1.3 riskiga.

**Lahendus.** Kuva veateade live-regioonis ja vii fookus esimesele vigasele väljale.

```html
<input
  type="email"
  id="newsletter-email"
  name="email"
  autocomplete="email"
  required
  aria-describedby="newsletter-error"
  :aria-invalid="hasError"
/>
<p id="newsletter-error" role="alert" aria-live="polite" v-if="hasError">
  Palun sisesta e-posti aadress korrektses vormingus: nimi@naide.ee
</p>
```

```js
if (!isValidEmail(email)) {
  hasError.value = true;
  await nextTick();
  emailInput.value?.focus();
  return;
}
```

**Tõend.** Punane raam tähistab veateadet, sinine katkendlik raam „Liitun“ nuppu, millele fookus jäi. Tõendiloost `PL-02-clean.json` nähtuvad `activeElement` ja veateate rollid.

![PL-02 tõend: veateade on nähtav, kuid fookus jääb nupule ja veateatel puudub live-roll.](evidence/annotated/PL-02.png){width=22cm}

```text
activeElement = BUTTON "Liitun"
#v-0-4-1-error: role=null, aria-live=null
input[name=email]: type=text, aria-invalid=true, aria-describedby=v-0-4-1-error
```

## PL-03 — Ühemärgiline otsing ei anna tagasisidet

**Kirjeldus.** Kui sisestada otsingusse üks märk (näiteks `a`, `%` või `&`) ja vajutada Enter, ei toimu midagi: URL jääb avaleheks, tulemusi ei kuvata ja vihjet ei anta. Tõenäoliselt on rakenduses minimaalne pikkus (2 tähemärki), kuid see ei ole kasutajale nähtav.

**Taastootmine.**

1. Ava <https://www.piletilevi.ee/>.
2. Klõpsa otsinguväljale ja sisesta `a`.
3. Vajuta Enter.
4. Vaata URL-i ja lehe teateid.

**Eeldatav tulemus.** Kuvatakse tulemused või selge vihje „Sisesta vähemalt 2 tähemärki“.

**Tegelik tulemus.** URL jääb `https://www.piletilevi.ee/`, ühtegi teadet ega tulemust ei kuvata.

**Prioriteet: P3.** Ei blokeeri põhivoogu, kuid jätab kasutaja ilma tagasisidest ja võib panna arvama, et otsing on katki.

**Lahendus.** Valideeri pikkus enne päringut ja kuva inline-vihje, mis on seotud otsinguväljaga.

```js
const q = searchInput.value.trim();
if (q.length < 2) {
  hint.textContent = 'Sisesta vähemalt 2 tähemärki.';
  hint.hidden = false;
  searchInput.setAttribute('aria-invalid', 'true');
  searchInput.focus();
  return;
}
hint.hidden = true;
searchInput.removeAttribute('aria-invalid');
router.push({ path: '/search', query: { query: q } });
```

**Tõend.** Otsingus on `a`, kuid leht ja URL ei muutu; `PL-03-clean.json` kinnitab, et `alerts` on tühi ja URL on avaleht.

![PL-03 tõend: „a“ + Enter ei anna tulemusi ega vihjet.](evidence/annotated/PL-03.png){width=22cm}

```text
input = "a"
location.href = https://www.piletilevi.ee/
alerts = []
```

## PL-04 — Koguse „−“ nupp on 0 juures aktiivne

**Kirjeldus.** Sündmuselehe piletikoguse juures on miinusnupp koguse 0 juures mitte-disabled, kuid klikk ei muuda kogust. Visuaalselt jääb mulje, et nupp on katki.

**Taastootmine.**

1. Ava <https://www.piletilevi.ee/piletid/3LPYQWSSXS/tonis-magi-kontsert-jaljed>.
2. Keri paremale „Piletite valimine“ juurde.
3. Veendu, et kogus on 0.
4. Klõpsa „−“ ja vaata kogust.

**Eeldatav tulemus.** Nupp on `disabled` (või peidetud), kuni kogus on 0.

**Tegelik tulemus.** `disabled=false`; enne klikki „Täispilet 52,00 € 0“ ja pärast klikki sama.

**Prioriteet: P4.** Väike UX-ebatäpsus, mis tekitab segadust, kuid ei blokeeri ostu.

**Lahendus.** Seo nupu olek kogusega ja sünkrooni ARIA-olek.

```html
<button
  data-cy="decrement-button"
  :disabled="quantity === 0"
  :aria-disabled="quantity === 0"
  @click="quantity = Math.max(0, quantity - 1)"
>
  −
</button>
```

**Tõend.** Punane raam tähistab miinusnuppu; `PL-04.json` kinnitab `decDisabled=false` ja koguse 0 → 0.

![PL-04 tõend: „−“ nupp on 0 juures aktiivne.](evidence/annotated/PL-04.png){width=22cm}

```text
decrement-button disabled = false
before: Täispilet 52,00 € 0
after:  Täispilet 52,00 € 0
```

## PL-05 — Filtri URL sisaldab duplikaatset `date` parameetrit

**Kirjeldus.** Kuupäevafiltri „Täna“ rakendamisel tekib URL-i kaks korda sama `date` parameeter. See pole kasutajale otseselt nähtav, kuid tekitab ebajärjekindlaid jagatud linke, topeltpäringuid ja raskendab analüütikat.

**Taastootmine.**

1. Ava <https://www.piletilevi.ee/search?query=kontsert>.
2. Ava filter „Toimumise aeg“ ja vali „Täna“.
3. Vajuta „Näita“.
4. Vaata aadressiriba URL-i.

**Eeldatav tulemus.** `...&date=2026-11-17&sortOrder=score&page=1` (üks `date`).

**Tegelik tulemus.** `...&date=2026-11-17&date=2026-11-17&sortOrder=score&page=1`.

**Prioriteet: P4.** Tehniline ebatäpsus, väike kasutajamõju.

**Lahendus.** Kasuta `URLSearchParams.set`-i või dedupeeri enne `router.push`-i.

```js
const params = new URLSearchParams();
params.set('query', query);
if (date) params.set('date', date); // mitte append
params.set('sortOrder', sortOrder);
params.set('page', '1');
router.push({ path: '/search', query: Object.fromEntries(params) });
```

**Tõend.** `PL-05.json` sisaldab täpset URL-i duplikaatse parameetriga.

![PL-05 tõend: filtri rakendamise tulemus.](evidence/annotated/PL-05.png){width=22cm}

```text
https://www.piletilevi.ee/search?query=kontsert&date=2026-11-17&date=2026-11-17&sortOrder=score&page=1
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Rakendus 2: Elisa

## Ülevaade

Elisa on Eesti telekommunikatsiooni- ja e-poe platvorm. Testimise fookus:

- päise otsing ja autocomplete;
- klaviatuuriga navigeerimine ja skip-link;
- tootelehe semantika (`h1`, `title`);
- ostukorvi juhtnuppude ligipääsetavus;
- HTML-i ja ressursside kvaliteet.

Kokku leiti **6 defekti**: 3 P2 ja 3 P3.

## Veaaruannete koondtabel

| Defekti ID | Kirjeldus | Taastootmise sammud | Eeldatav tulemus | Tegelik tulemus | Prioriteet | Lahendus | Testimise kuupäev | Testija |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| EL-01 | Otsinguväljal Enter ei käivita otsingut; tulemuste lehele viib ainult „Veel tulemusi...“. | 1) Ava avaleht. 2) Sisesta `iphone`. 3) Vajuta Enter. 4) Võrdle URL-i. | Enter viib `/et/otsing?search=iphone`. | URL jääb `https://www.elisa.ee/`; fookus jääb inputile. | P2 | Käsitle `keydown.enter` või vormi `submit` ja suuna tulemuste lehele. | 17.11.2026 | Sten |
| EL-02 | Skip-link „Liigu edasi põhisisu juurde“ viitab teisele skip-lingile (`href="#"`), mitte `<main>`-ile. | 1) Ava avaleht. 2) Vajuta Tab. 3) Vajuta Enter. 4) Vaata `activeElement`/`hash`/`scrollY`. | Fookus `<main id="main-content" tabindex="-1">`-l. | Fookus `A#skip-to-main-content`, `href="#"`, `hash=#skip-to-main-content`, `scrollY=105`. | P2 | Üks skip-link `href="#main-content"`, `main tabindex="-1"`, fookuse juhtimine. | 17.11.2026 | Sten |
| EL-03 | Tootelehel puudub `h1`; toote nimi on `div`-is. | 1) Ava tooteleht. 2) Kontrolli `document.querySelectorAll('h1').length`. | Üks `h1` toote nimega. | `h1Count=0`; toote nimi on `div`-is. | P3 | Renderda toote nimi `h1`-na; sektsioonid `h2`-na. | 17.11.2026 | Sten |
| EL-04 | Tootelehe `title` on kõigil toodetel „Elisa iseteenindus“. | 1) Ava tooteleht. 2) Vaata `document.title` ja brauseri tab-i. | „Apple iPhone Duo 512GB \| Elisa“. | „Elisa iseteenindus“. | P3 | Dünaamiline `title` toote nimest (SSR/meta). | 17.11.2026 | Sten |
| EL-05 | Ostukorvi ikoonnupu `aria-label` on inglise keeles. | 1) Ava avaleht. 2) Ava Accessibility-puu. 3) Otsi ostukorvi nupp. | „Ostukorv, 0 toodet“. | „Shopping cart, 0 items in cart“. | P3 | Lokaliseeri `aria-label` i18n-võtmest. | 17.11.2026 | Sten |
| EL-06 | Otsingu autocomplete'il puudub `combobox`-semantika: `role`, `aria-expanded`, `aria-controls`, `listbox`/`option` puuduvad. | 1) Ava avaleht. 2) Sisesta `iphone`. 3) Kontrolli inputi atribuute ja AX-puud. | `role="combobox"`, `aria-expanded="true"`, `aria-controls`, `listbox`/`option`. | `role=null`, `ariaExpanded=null`, `listbox/option=0`; soovitused on ainult visuaalsed. | P2 | Rakenda WAI-ARIA combobox pattern koos klaviatuuritugia. | 17.11.2026 | Sten |

## EL-01 — Enter ei käivita otsingut

**Kirjeldus.** Päise otsing väljastab sisestamisel soovitusi, kuid Enter ei käivita otsingut ega suuna tulemuste lehele. Ainus viis tulemusteni on hiirega „Veel tulemusi...“ lingi klõpsamine. Klaviatuuriga kasutaja jääb seisma.

**Taastootmine.**

1. Ava <https://www.elisa.ee/> ja nõustu küpsistega.
2. Klõpsa päise otsinguväljale.
3. Sisesta `iphone`.
4. Vajuta Enter ja vaata URL-i.
5. Klõpsa „Veel tulemusi...“ ja võrdle URL-i.

**Eeldatav tulemus.** Enter suunab samale tulemuste lehele, kuhu viib „Veel tulemusi...“: `https://www.elisa.ee/et/otsing?search=iphone`.

**Tegelik tulemus.** URL jääb `https://www.elisa.ee/`; fookus jääb otsinguväljale, tulemusi ei kuvata. „Veel tulemusi...“ klõps viib õigesti `/et/otsing?search=iphone`.

**Prioriteet: P2.** Põhifunktsioon (otsing) ei ole klaviatuuriga lõpuni kasutatav; mõjutab ka kiiret kasutamist.

**Lahendus.** Käsitle Enterit nii, et see käivitab sama tegevuse nagu „Veel tulemusi...“, ning hoia see kooskõlas soovituste klaviatuurinavigatsiooniga.

```vue
<input
  id="eds-input-native-0"
  type="search"
  v-model="query"
  @keydown.enter.prevent="submitSearch"
  @keydown.esc="closeSuggestions"
/>

<script setup>
function submitSearch() {
  const q = query.value.trim();
  if (!q) return;
  router.push({ path: '/et/otsing', query: { search: q } });
}
</script>
```

Alternatiiv: wrapi otsing `<form @submit.prevent="submitSearch">`-i ja kasuta nuppu, mis on ka ekraanil nähtav.

**Tõend.** Soovitused on nähtavad, kuid pärast Enterit URL ei muutu; `EL-01b.json` sisaldab enne/pärast URL-i ja „Veel tulemusi“ sihtkohta.

![EL-01 tõend: Enteri järel jääb URL avaleheks, soovitused on endiselt nähtavad.](evidence/annotated/EL-01.png){width=22cm}

```text
beforeUrl  = https://www.elisa.ee/
afterUrl   = https://www.elisa.ee/
clickMoreUrl = https://www.elisa.ee/et/otsing?search=iphone
```

## EL-02 — Skip-link ei vii põhisisu juurde

**Kirjeldus.** Esimene fookustatav element on skip-link „Liigu edasi põhisisu juurde“, mille `href="/#skip-to-main-content"`. See viib teisele skip-lingile, mille `href="#"`; sealt edasi ei liigu fookus põhisisu juurde. Tulemuseks on katkine skip-navigatsioon: kasutaja peab uuesti Tab-iga edasi liikuma.

**Taastootmine.**

1. Ava <https://www.elisa.ee/> ja nõustu küpsistega.
2. Vajuta Tab – fookus läheb skip-lingile.
3. Vajuta Enter.
4. Kontrolli `document.activeElement`, `location.hash` ja `window.scrollY`.
5. Vajuta uuesti Enter.

**Eeldatav tulemus.** Fookus liigub `<main id="main-content" tabindex="-1">`-le ja ekraanilugeja alustab põhisisust.

**Tegelik tulemus.** Fookus on `A#skip-to-main-content` (`href="#"`), `hash=#skip-to-main-content`, `scrollY=105`; teine Enter ei muuda asukohta.

**Prioriteet: P2.** Skip-link on klaviatuuri ja ekraanilugeja põhinavigatsioon; katkine skip-link mõjutab igat lehe külastust.

**Lahendus.** Kasuta ühte skip-linki, mis viitab olemasolevale ja fookustatavale põhisisu konteinerile.

```html
<a class="skip-link" href="#main-content">Liigu põhisisu juurde</a>

<main id="main-content" tabindex="-1">
  ...
</main>
```

```js
document.querySelector('.skip-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  const main = document.querySelector('#main-content');
  main?.focus();
  main?.scrollIntoView();
});
```

Eemaldada tuleks teine, `href="#"`-iga skip-link ja tagada, et `#main-content` on unikaalne.

**Tõend.** Fookusega skip-link on nähtav (punane katkendlik äär); `EL-02b.json` näitab, et Enteri järel on fookus teisel lingil, mitte `main`-il.

![EL-02 tõend: fookus on skip-lingil, kuid Enter viib teisele lingile.](evidence/annotated/EL-02.png){width=22cm}

```text
firstFocus: href=/#skip-to-main-content, scrollY=0
afterFirst: active=A#skip-to-main-content, href=#, hash=#skip-to-main-content, scrollY=105
afterSecond: active=A#skip-to-main-content, hash=#skip-to-main-content, scrollY=105
```

## EL-03 — Tootelehel puudub `h1`

**Kirjeldus.** Tootelehel kuvatakse toote nimi suurelt, kuid see on `div`-element, mitte `h1`. Lehel ei ole ühtegi `h1`-elementi. Ekraanilugeja pealkirjanavigatsioon ei leia lehe peamist pealkirja; otsingumootorid ei saa samuti lehe hierarhiat õigesti tõlgendada.

**Taastootmine.**

1. Ava <https://www.elisa.ee/et/seadmed/eraklient/nutitelefonid/apple/iphone-duo-512gb>.
2. Oota, kuni toode on laaditud.
3. Käivita `document.querySelectorAll('h1').length`.
4. Ava Accessibility → Headings.

**Eeldatav tulemus.** Üks `h1` tekstiga „Apple iPhone Duo 512GB“.

**Tegelik tulemus.** `h1Count=0`; toote nimi on `div`-is.

**Prioriteet: P3.** Mõjutab ekraanilugeja navigatsiooni ja SEO-d, kuid mitte ostu sooritamist.

**Lahendus.** Renderda toote nimi `h1`-na ja hoia ülejäänud sektsioonid `h2`/`h3` hierarhias.

```html
<h1 class="product-title">Apple iPhone Duo 512GB</h1>

<h2>Vali makseviis</h2>
<h2>Võta lisaks</h2>
<h2>Tooteinfo</h2>
```

**Tõend.** Punane raam tähistab toote nime, mis on DOM-is `div`; `EL-03b.json` kinnitab `h1Count=0`.

![EL-03 tõend: toote nimi on suur, kuid mitte H1.](evidence/annotated/EL-03.png){width=22cm}

```text
document.title = "Elisa iseteenindus"
document.querySelectorAll('h1').length = 0
productVisible = true
```

## EL-04 — Tootelehe `title` on üldine

**Kirjeldus.** Kõikide toodete lehe `<title>` on „Elisa iseteenindus“, mitte toote nimi. Brauseri tab, järjehoidja, ajalugu ja otsingumootori tulemus on eristamatud.

**Taastootmine.**

1. Ava mõni tooteleht, näiteks <https://www.elisa.ee/et/seadmed/eraklient/nutitelefonid/apple/iphone-duo-512gb>.
2. Vaata brauseri tab-i või käivita `document.title`.

**Eeldatav tulemus.** `Apple iPhone Duo 512GB | Elisa`.

**Tegelik tulemus.** `Elisa iseteenindus`.

**Prioriteet: P3.** Mõjutab kasutatavust (tab/ajalugu/järjehoidjad) ja SEO-d; ei blokeeri funktsioone.

**Lahendus.** Sea `title` tooteandmetest, eelistatavalt serveripoolselt, et see oleks nähtav ka enne JS-i käivitumist.

```js
useHead({
  title: `${product.name} | Elisa`,
  meta: [{ name: 'description', content: product.shortDescription }],
});
```

**Tõend.** Logi `EL-04b.json` sisaldab `title` väärtust ja oodatud väärtust.

![EL-04 tõend: tootelehe title on üldine.](evidence/annotated/EL-04.png){width=22cm}

```text
document.title = "Elisa iseteenindus"
Oodatud: "Apple iPhone Duo 512GB | Elisa"
```

## EL-05 — Ostukorvi `aria-label` on inglise keeles

**Kirjeldus.** Eestikeelsel lehel on ostukorvi ikoonnupu `aria-label` inglise keeles: „Shopping cart, 0 items in cart“. Ekraanilugeja loeb selle ette inglise keeles, kuigi lehe keel on `et`.

**Taastootmine.**

1. Ava <https://www.elisa.ee/>.
2. Ava DevTools → Accessibility või otsi shadow DOM-ist `eds-header-nav-icon-button#cart`.
3. Loe nupu ligipääsetav nimi.

**Eeldatav tulemus.** „Ostukorv, 0 toodet“ (või „Ostukorv“ ilma arvuta).

**Tegelik tulemus.** „Shopping cart, 0 items in cart“.

**Prioriteet: P3.** Kielesegadus segab ekraanilugeja kasutajat; mõjutab ka brändi kvaliteeti.

**Lahendus.** Võta `aria-label` i18n-sõnastikust ja uuenda see ostukorvi muutumisel.

```html
<button
  class="eds-header-nav-icon-button"
  :aria-label="t('cart.label', { count: cartCount })"
>
  <span aria-hidden="true"><!-- ikoon --></span>
</button>
```

```json
{
  "cart": {
    "label": "Ostukorv, {count} toodet"
  }
}
```

**Tõend.** Punane raam tähistab ostukorvi nuppu; `EL-05b.json` sisaldab AX-nime ja shadow DOM-i HTML-i.

![EL-05 tõend: ostukorvi nupu aria-label on inglise keeles.](evidence/annotated/EL-05.png){width=22cm}

```text
AX button name = "Shopping cart, 0 items in cart"
<button aria-label="Shopping cart, 0 items in cart">
```

## EL-06 — Otsingu autocomplete'il puudub combobox-semantika

**Kirjeldus.** Otsinguväljale sisestamisel avaneb soovituste paneel, kuid input on lihtne `textbox`: puuduvad `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` ja `aria-activedescendant`. Soovituste konteineril puuduvad `listbox`/`option` rollid. Ekraanilugeja ei tea, et soovitused avanesid ega kuidas neid valida.

**Taastootmine.**

1. Ava <https://www.elisa.ee/>.
2. Klõpsa otsinguväljale ja sisesta `iphone`.
3. Oota, kuni soovitused ilmuvad.
4. Kontrolli inputi atribuute ja AX-puud.

**Eeldatav tulemus.** Input on `role="combobox"` olekuga `aria-expanded="true"`, viitab `aria-controls`-iga soovituste `listbox`-ile ja aktiivsele `option`-ile.

**Tegelik tulemus.** `role=null`, `ariaExpanded=null`, `ariaControls=null`, `ariaAutocomplete=null`, `ariaActivedescendant=null`; `listbox`/`option` elemente on 0, kuigi nähtavaid soovitusi on 5.

**Prioriteet: P2.** Autocomplete on mõeldud kiireks otsinguks, kuid ekraanilugeja kasutaja jaoks on see nähtamatu; WCAG 4.1.2.

**Lahendus.** Rakenda WAI-ARIA combobox pattern koos klaviatuuritugia.

```html
<input
  id="site-search"
  role="combobox"
  aria-expanded="true"
  aria-controls="search-suggestions"
  aria-autocomplete="list"
  aria-activedescendant="suggestion-0"
  aria-label="Otsi toodet või teenust"
/>

<ul id="search-suggestions" role="listbox">
  <li id="suggestion-0" role="option" aria-selected="true">Apple iPhone Duo 512GB</li>
  <li id="suggestion-1" role="option" aria-selected="false">Apple iPhone 17e 256GB</li>
</ul>
```

Klaviatuur: `ArrowDown`/`ArrowUp` liigutavad aktiivset valikut, `Enter` valib, `Escape` sulgeb. Tulemuste arvu muutumisel teatada `aria-live="polite"` regiooniga.

**Tõend.** Soovitused on nähtavad, kuid AX-puus on ainult `textbox` nimega „Sisesta märksõna“; `EL-06b.json` kinnitab `listbox/option=0`.

![EL-06 tõend: soovitused on nähtavad, kuid combobox-semantika puudub.](evidence/annotated/EL-06.png){width=22cm}

```text
role=null, aria-expanded=null, aria-controls=null, aria-autocomplete=null
listbox/option elements = 0
visible suggestion text nodes = 5
AX: textbox "Sisesta märksõna"
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Täiendavad tähelepanekud

Need ei ole koondtabelis eraldi defektidena, kuid mõjutavad kvaliteeti ja monitooringut.

| ID | Tähelepanek | Tõend | Soovitus |
|---|---|---|---|
| T-01 | Elisa lehtedel (sh otsingutulemused) päritakse `https://www.elisa.ee/themes/elisa/assets/img/bg01.png`, mis vastab 404-ga. | `EL-01b.json`, `EL-02b.json` võrgulogid | Parandada tee või eemaldada viide; lisada CI-sse 4xx-assetite kontroll. |
| T-02 | Piletilevi vastused sisaldavad konsooliviga: `Error with Permissions-Policy header: Parse of permissions policy failed...`. | `PL-01-clean.json` jm logid | Parandada `Permissions-Policy` päis serveris; viga ei ole rakendusloogikas. |
| T-03 | Piletilevi sündmuseleht ilma istekohtade kaardita pärib `api/v1/store/seat-map/...` ja saab 404; see võib olla oodatud fallback, kuid tekitab müra. | `PL-04.json` | Käsitleda 404-t oodatud olekuna ja vältida konsooliviga. |
| T-04 | Nii Piletilevi kui Elisa otsinguväli toetub nähtavale placeholderile; püsiv silt puudub. Ligipääsetav nimi on olemas, kuid sisestamisel kaob visuaalne kontekst. | PL-01/EL-06 AX-puu | Lisada püsiv silt või ujuv silt; hoida `aria-label` sünkroonis. |

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Soovitused ja parandusplaan

## Prioriseeritud tegevuskava

| Sprind | Tegevus | Defektid | Vastutaja (soovitus) |
|---|---|---|---|
| Sprint 1 | Parandada otsingu klaviatuur ja combobox-semantika; skip-link; nimeta ikoonnupud | PL-01, PL-02, EL-01, EL-02, EL-06 | Front-end + ligipääsetavuse spetsialist |
| Sprint 2 | Tootelehe `h1` ja `title`; ostukorvi lokaliseeritud silt; uudiskirja veateate fookus | EL-03, EL-04, EL-05, PL-02 | Front-end + sisutoimetaja |
| Sprint 3 | Väiksemad UX/tehnilised parandused ja monitooring | PL-03, PL-04, PL-05, T-01…T-04 | Front-end + DevOps |

## Kvaliteediväravad

1. **Ligipääsetavuse kontroll CI-s.** Lisada Playwrighti testidele `axe-core` ja kohandatud kontrollid: igal `button`/`a`-l peab olema mitte-tühi nimi; igal vormiväljal silt; `h1` olemasolu; skip-linki sihtmärk.
2. **Klaviatuuritestid.** Iga olulise voo (otsing, ostukorv, uudiskiri, filtrite avamine) kohta test, mis läbitakse ainult klaviatuuriga.
3. **Komponendiregister.** Ikoonnupud, combobox, skip-link ja veateated kirjeldada ühiste nõuetega (nimi, roll, olek, fookus).
4. **SEO/HTML kontroll.** CI-s kontrollida `title`, `h1` ja `meta description` olemasolu tootelehtedel.
5. **Võrgumonitooring.** Käsitleda 4xx/5xx ressursse ja konsoolivigu testide ebaõnnestumisena.

## Regressioonitestide ettepanekud

| Test | Kontroll | Seotud defekt |
|---|---|---|
| `a11y-icon-buttons.spec` | Kõikidel ikoonnuppudel on `aria-label`; dekoratiivsed ikoonid `aria-hidden` | PL-01, EL-05 |
| `newsletter-error.spec` | Vale e-post → fookus väljal / `role=alert`; `aria-invalid=true` | PL-02 |
| `search-min-length.spec` | Ühemärgiline otsing → nähtav vihje | PL-03 |
| `ticket-quantity.spec` | Kogus 0 → „−“ disabled; kogus 1 → „−“ aktiivne | PL-04 |
| `search-date-filter.spec` | URL-is täpselt üks `date` parameeter | PL-05 |
| `search-enter.spec` | Enter → `/et/otsing?search=...` | EL-01 |
| `skip-link.spec` | Tab + Enter → fookus `main`-il | EL-02 |
| `product-semantics.spec` | Üks `h1`; `title` sisaldab toote nime | EL-03, EL-04 |
| `search-combobox.spec` | `role=combobox`, `aria-expanded`, `listbox`, klaviatuur | EL-06 |

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Lisa A. Tõendifailid

Kõik tõendid asuvad kaustas `evidence/`. Failinimed on seotud defektide ID-dega.

| Defekt | Ekraanipilt (annotatsiooniga) | Toorandmed |
|---|---|---|
| PL-01 | `evidence/annotated/PL-01.png` | `evidence/final/PL-01-clean.json`, `PL-01b.json` |
| PL-02 | `evidence/annotated/PL-02.png` | `evidence/final/PL-02-clean.json` |
| PL-03 | `evidence/annotated/PL-03.png` | `evidence/final/PL-03-clean.json` |
| PL-04 | `evidence/annotated/PL-04.png` | `evidence/final/PL-04.json` |
| PL-05 | `evidence/annotated/PL-05.png` | `evidence/final/PL-05.json` |
| EL-01 | `evidence/annotated/EL-01.png` | `evidence/final/EL-01b.json` |
| EL-02 | `evidence/annotated/EL-02.png` | `evidence/final/EL-02b.json` |
| EL-03 | `evidence/annotated/EL-03.png` | `evidence/final/EL-03b.json` |
| EL-04 | `evidence/annotated/EL-04.png` | `evidence/final/EL-04b.json` |
| EL-05 | `evidence/annotated/EL-05.png` | `evidence/final/EL-05b.json` |
| EL-06 | `evidence/annotated/EL-06.png` | `evidence/final/EL-06b.json` |

# Lisa B. Taastootmise skriptid

| Fail | Otstarve |
|---|---|
| `scripts/recon.js` | Esmane luure: lehe laadimine, konsooli- ja võrguvead, põhimõõdikud. |
| `scripts/probe.js` | Ligipääsetavuse ja paigutuse detailprobe. |
| `scripts/capture-evidence.js` | Kõigi defektide scriptitud taastootmine ja tõendite salvestamine. |
| `scripts/annotate.py` | Ekraanipiltide annoteerimine (ID, kontekst, punane raam). |
| `scripts/build_report.sh` | Raporti DOCX/PDF-i koostamine Pandociga. |

Käivitamine:

```bash
cd veaaruanded-2026-11
PLAYWRIGHT_BROWSERS_PATH=../apollo-playwright-tests/.playwright-browsers \
  node scripts/capture-evidence.js
python3 scripts/annotate.py
bash scripts/build_report.sh
```

# Lisa C. Piirangud ja vastutus

- Testimine viidi läbi avalikul produktsioonikeskkonnas 17.11.2026; tulemused võivad pärast seda muutuda.
- Ei kasutatud sisselogimist, makseid ega päris kasutajaandmeid. Uudiskirja ja sooduskoodi väljadesse sisestati ainult teadlikult vale testandmestik.
- Defektide parandusettepanekud põhinevad DOM-i, AX-puu ja võrguvastuste vaatlusel, mitte lähtekoodil. Täpne teostus võib erineda sõltuvalt raamistikust ja komponentide struktuurist.
- Raport ei ole täielik turvaaudit, jõudlustest ega kogu saidi regressioonitest. See keskendub valitud kasutajateekondadele ja ligipääsetavusele.

---

**Dokumendi versioon:** 1.0 · **Koostatud:** 17.11.2026 · **Testija:** Sten
