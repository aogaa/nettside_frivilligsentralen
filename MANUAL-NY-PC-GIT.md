# Ny PC: installere Git og hente prosjektet

Denne guiden er laget for Windows (PowerShell), og er så enkel som mulig.

## 1. Installer Git

1. Gå til: `https://git-scm.com/download/win`
2. Last ned og kjør installasjonsfilen.
3. Under installasjon: bruk standardvalg (det fungerer fint i dette prosjektet).
4. Åpne PowerShell og sjekk at Git virker:

```powershell
git --version
```

Hvis du ser et versjonsnummer, er Git installert riktig.

---

## 2. Sett opp navn og e-post i Git (første gang på ny PC)

Bruk samme e-post som på GitHub-kontoen din:

```powershell
git config --global user.name "Ditt Navn"
git config --global user.email "din.epost@eksempel.no"
```

Sjekk:

```powershell
git config --global --list
```

---

## 3. Klon prosjektet fra GitHub (første gang)

1. Velg hvor prosjektet skal ligge, f.eks. `C:\Prosjekter`
2. Kjør:

```powershell
cd C:\Prosjekter
git clone https://github.com/aogaa/nettside_frivilligsentralen.git
cd nettside_frivilligsentralen
```

---

## 4. Hent siste endringer (hver gang du starter)

```powershell
cd C:\Prosjekter\nettside_frivilligsentralen
git status
git pull
```

---

## 5. Vanlig arbeidsflyt

Når du har gjort endringer:

```powershell
git add .
git commit -m "Kort beskrivelse av endringen"
git push
```

---

## 6. Hvis `git pull` feiler fordi du har lokale endringer

Sikker løsning:

```powershell
git status
git add .
git commit -m "Lagrer lokalt arbeid før pull"
git pull
```

Hvis du ikke vil committe ennå:

```powershell
git stash
git pull
git stash pop
```

---

## 7. Innlogging mot GitHub (hvis du blir spurt)

Ved `git push`/`git pull` kan du bli bedt om innlogging.

Anbefalt:
- Logg inn via Git Credential Manager-vinduet som dukker opp.
- Bruk GitHub-kontoen som har tilgang til repoet.

Hvis passord ikke godtas:
- GitHub bruker vanligvis **token** i stedet for passord for HTTPS.
- Opprett Personal Access Token i GitHub og bruk det som passord ved behov.

---

## 8. Rask sjekkliste for ny PC

- [ ] Git installert (`git --version`)
- [ ] Navn/e-post satt i Git config
- [ ] Repo klonet lokalt
- [ ] `git pull` fungerer
- [ ] Kan åpne prosjektet i VS Code
- [ ] Kan `git push` uten feil

---

## 9. Nyttige kommandoer

```powershell
git status
git branch
git pull
git add .
git commit -m "..."
git push
```

Det er alt du trenger for å komme i gang på en ny PC.
