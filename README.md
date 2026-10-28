# 🎓 Mfumo wa Matokeo ya Shule

Mfumo wa kusajili wanafunzi, kuingiza alama za mitihani na kuchapisha ripoti kwa shule za msingi (Darasa I–VII). Unafanya kazi moja kwa moja kwenye kivinjari — hauhitaji seva wala intaneti baada ya kufunguliwa.

## ✨ Vipengele
- **Kuingia kwa email na nenosiri**; Msimamizi husajili walimu kupitia menyu ya **WATUMIAJI**
- **DARASA** – usajili wa wanafunzi (mmoja mmoja au wengi kwa mara moja), kupandisha darasa
- **MITIHANI** – alama kwa masomo 6, template ya CSV/Excel, jumla, wastani, daraja na nafasi papo hapo
- **RIPOTI** – ripoti ya kila mwanafunzi, broadsheet ya darasa, uchambuzi wa masomo; kuchapisha A4
- Nembo ya shule, mipaka ya madaraja inayobadilika, nakala ya data (backup/restore JSON)
- Rangi hafifu kwa kila menyu, inafaa pia kwa simu

## 📁 Muundo
```
index.html          Ukurasa mkuu (HTML)
css/style.css       Mtindo na rangi (CSS)
js/app.js           Madarasa, mitihani, ripoti (JavaScript)
js/auth.js          Usajili, kuingia, watumiaji (JavaScript)
.github/workflows/  Uchapishaji wa kiotomatiki GitHub Pages (YAML)
```

## 🚀 Kuanza
1. Fungua `index.html` kwa kivinjari, au chapisha kwa GitHub Pages (*Settings → Pages → Source: GitHub Actions*; workflow ipo tayari).
2. Mara ya kwanza, tengeneza akaunti ya **Msimamizi**.
3. Ingia, weka jina la shule kwenye **Mipangilio ya Shule**, kisha sajili wanafunzi.
4. Sajili walimu wengine kwenye menyu ya **WATUMIAJI**.

## ⚠️ Usalama — soma hii
Data zote (wanafunzi, alama, watumiaji) huhifadhiwa kwenye **localStorage ya kivinjari** kilichotumika. Nenosiri huhifadhiwa kama hash (PBKDF2 + salt), lakini kwa kuwa hakuna seva, mtu mwenye ufikiaji wa kompyuta hiyo anaweza kuona au kubadilisha data. Kwa hiyo:
- Watumiaji hawashirikiani data kati ya kompyuta tofauti (tumia **Pakua Nakala** kuhamisha).
- Ukitaka akaunti za kweli zinazoshirikiwa, mfumo unahitaji backend (mf. Firebase, Supabase).
- Pakua nakala ya data mara kwa mara.

## 📜 Leseni
MIT — angalia `LICENSE`.
