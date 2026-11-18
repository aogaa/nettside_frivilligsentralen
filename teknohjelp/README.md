# Teknohjelp med Julie

Offentlig side: https://frivilligsentralen.org/teknohjelp/.
Admin: https://admin.frivilligsentralen.org/teknohjelp/.

Nettsiden bruker skjematjenestens booking-API på VPS-en. Backend-kilde og driftsrutine
finnes i aogaa/skjematjeneste, docs/TEKNOHJELP.md. Ingen Firebase- eller FormSubmit-integrasjon.

Fem faste mandagstimer, gratis på Møteplass Vinderen, Slemdalsveien 72.
Ledige timer hentes ved lasting, manuell oppdatering og hvert 30. sekund når siden
vises. Bare serveren kan avgjøre om en time fortsatt er ledig. Valgfri e-post utelates
hvis feltet er tomt. Usikre nettutfall beholder idempotensnøkkel og skjemaopplysninger.
Kvittering vises først etter bekreftet databaselagring.

Systemadministrator bruker eksisterende Utleie-e-post/passord. Julie har en separat
begrenset konto. Admin lager engangslenke til passordoppretting under Julies tilgang.
Del den direkte med Julie. Det sendes ingen automatisk kontoinvitasjon.
Julie får varsel til casawary82@gmail.com når noen bestiller, også ved adminregistrering.
Varselet inneholder dato, tid og adminlenke; personopplysninger vises etter innlogging.

Personopplysninger utløper to kalendermåneder etter timens dato. Privat API skjuler
utløpte opplysninger, og den daglige jobben sletter dem og beholder månedlige antall.
Backup følger separat 30-dagers oppbevaring. Avbestillinger gjøres av sentralen.

Tester i skjematjeneste: tests/teknohjelp.test.js og tests/teknohjelp-ui.test.js.
WEBSITE_ROOT settes til nettsidecheckout for DOM-test av faktisk HTML/JS.
Ingen fiktive bestillinger skal sendes til Julie for å teste produksjonen.

Fra 7. desember 2026 gjelder 10.00–10.45, 10.50–11.35, 11.40–12.25
(kun drop-in), 12.45–13.30 og 13.35–14.20. Tidligere datoer og eksisterende
reservasjoner beholder opprinnelige tider. Drop-in vises uten bestillingsknapp.
