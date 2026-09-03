# Røa Soup

Kampanjeside for Røa Soup - lokal pitchekveld og mikrostøtte på Røa Bibliotek
tirsdag 22. september kl. 18.00. Hovedarrangør er Oslo Vest Frivilligsentral.

## Lokal kjøring

Kjør fra roten av `nettside_frivilligsentralen`:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Åpne deretter:

`http://127.0.0.1:8765/roa-soup/`

## Filer

- `roa-soup/index.html` - siden.
- `css/roa-soup.css` - kampanjens profil (varm gul/terrakotta fra flyeren).
- `js/roa-soup-form.js` - validering, tegnteller og innsending.
- `images/roa-soup/` - hero, Open Graph-bilde og alle logoer.
- `soup/` - originalfilene som ble levert (kildemateriale, ikke brukt av siden).

## Logoer

Alle partnerlogoer er normalisert til 600x360 px PNG med gjennomsiktig bakgrunn og
lik optisk størrelse (skalert etter «blekkmengde», ikke bare bredde/høyde), slik at
de står likt i rutenettet. Bearbeiding som ble gjort:

- `blindsanitet.png` - kremfarget bakgrunn fjernet.
- `moteplassroa.jpg` - offwhite bakgrunn fjernet, konvertert til PNG.
- `godmatlyst.png` - filen var en lys variant (#D0E8C8) beregnet på mørk bakgrunn og
  ble nesten usynlig på hvitt. Fargen er satt til grønn (#5B9A3C). **Be gjerne om den
  ordinære logofilen fra God Matlyst og bytt den inn.**
- `roa_kirke.png` - hvit logo på mørkerød flate. Bakgrunnen kan ikke fjernes uten å
  miste logoen, så den er beholdt som en rød flate og skalert litt ned.

Hovedarrangøren vises større enn de øvrige: som lockup i heroen og i et eget
arrangørkort over partnerrutenettet.

## Skjema

FormSubmit-oppsett som de andre skjemaene på siden, men med ny mottaker:
`mari@oslovest.frivilligsentral.no`. Feltene er navn, telefon, e-post, ideen og
personvernsamtykke. Samtykke til informasjon om lignende arrangementer er valgfritt.

**Viktig før publisering:** FormSubmit må aktiveres én gang per mottakeradresse.
Første innsending fra produksjon sender en bekreftelseslenke til Mari, som må klikkes
før skjemaet begynner å levere e-post. Aktiveringen gjelder per origin, så testing fra
localhost fungerer ikke - første test må gjøres på
https://frivilligsentralen.org/roa-soup/.

## Kontrollert

- Desktop 1440 px og mobil 375 px.
- Ingen horisontal scrolling, ingen manglende bilder, ingen konsollfeil.
- Feiloppsummering og feltfeil ved tomt skjema.
- Tegnteller i idéfeltet.

## Publisering

Publiseres via repositoryets eksisterende GitHub Pages-rutine etter godkjenning.
Offentlig adresse: https://frivilligsentralen.org/roa-soup/
