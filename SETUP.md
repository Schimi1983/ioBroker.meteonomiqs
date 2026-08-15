# Setup — von hier zum laufenden Adapter

Alles unten läuft **auf deinem Rechner**, nicht auf dem ioBroker-Server.
Voraussetzungen: Node.js ≥ 20, npm ≥ 9, git, ein GitHub-Account.

---

## 1. Platzhalter ersetzen

An drei Stellen steht `Schimi1983`. Einmal ersetzen:

```bash
cd ioBroker.wetter-com
# macOS:  sed -i '' 's/Schimi1983/deinuser/g' package.json io-package.json README.md
sed -i 's/Schimi1983/deinuser/g' package.json io-package.json README.md
grep -rn Schimi1983 . || echo "alle ersetzt"
```

Falls Name/E-Mail in `package.json`, `io-package.json` (`authors`) und `LICENSE` nicht passen: dort ebenfalls anpassen.

---

## 2. Abhängigkeiten installieren und bauen

```bash
npm install
npm run build     # TypeScript -> build/
npm run check     # Typprüfung ohne Ausgabe
npm run lint
npm run test:ts   # Unit-Tests (25 Stück)
npm run test:package
```

`npm run check` ist der wichtigste Schritt — er ist hier in der Sandbox **nicht** gelaufen,
weil die npm-Registry gesperrt war. Wenn `tsc` etwas anmerkt, schick mir die Ausgabe.

---

## 3. Lokal ausprobieren (ohne Produktiv-ioBroker)

```bash
npm install --global @iobroker/dev-server
dev-server setup      # legt eine Wegwerf-ioBroker-Instanz an
dev-server watch      # Admin unter http://localhost:8081
```

Im Admin eine Instanz anlegen, API-Key eintragen, Log beobachten.
Erwartete Zeilen beim Start:

```
Update schedule: 01:10 (tier 1) | 11:40 (tier 2) | 18:40 (tier 3)
Budget: 3 fetches/day = at most 93 calls/month out of 100 (7 spare)
Fetching forecast (01:10) for 51.257/6.403, 7 days.
Update finished: 7 days processed.
```

---

## 4. Auf GitHub veröffentlichen

Repository **`ioBroker.wetter-com`** anlegen (öffentlich, ohne README/Lizenz —
beides ist schon da), dann:

```bash
git init
git add .
git commit -m "feat: initial release 0.1.0"
git branch -M main
git remote add origin https://github.com/deinuser/ioBroker.wetter-com.git
git push -u origin main
```

Ab jetzt ist der Adapter installierbar über
**Admin → Adapter → Expertenmodus → Aus eigener URL installieren → GitHub**.

---

## 5. Adapter-Checker

Bevor irgendetwas Richtung offizielles Repository geht:

<https://adapter-check.iobroker.in/>

Repository-URL eintragen, alle Errors abarbeiten. Warnungen sind nicht alle zwingend,
Errors schon.

---

## 6. npm-Veröffentlichung (optional)

```bash
npm login
npm publish        # veröffentlicht als iobroker.wetter-com
```

Für die automatische Veröffentlichung per Tag liegt der Workflow bereits unter
`.github/workflows/test-and-release.yml`. Dafür in den GitHub-Repo-Settings unter
*Secrets and variables → Actions* ein Secret `NPM_TOKEN` hinterlegen.

Neue Version dann so:

```bash
npm i -D @alcalzone/release-script @alcalzone/release-script-plugin-iobroker \
         @alcalzone/release-script-plugin-license @alcalzone/release-script-plugin-manual-review
npm run release patch
```

---

## 7. Offizielles ioBroker-Repository (optional)

Reihenfolge, die im Forum erwartet wird:

1. Adapter-Checker fehlerfrei
2. Thread im [ioBroker-Forum](https://forum.iobroker.net/) unter *Tester gesucht* eröffnen
3. Rückmeldungen einarbeiten, ein paar Wochen laufen lassen
4. Pull Request gegen [`ioBroker/ioBroker.repositories`](https://github.com/ioBroker/ioBroker.repositories) (zuerst `latest`)

**Vorher:** Es gibt bereits [`eifel-tech/ioBroker.wettercom`](https://github.com/eifel-tech/ioBroker.wettercom)
für dieselbe API. Der Adapter ist nicht im offiziellen Repository, aber beim PR wird das
Thema fast sicher aufkommen. Ein kurzer Issue oder eine Mail an eifel-tech vorab spart
Diskussionen — im besten Fall wird daraus eine Zusammenarbeit statt zwei paralleler Adapter.

---

## Was noch fehlt

- **Ausprobiert** ist der Adapter nicht: die Sandbox hatte weder npm-Registry
  noch Zugriff auf `forecast.meteonomiqs.com`. Logik und Struktur sind geprüft,
  der erste echte Lauf steht aus.
- **Integrationstest** (`npm run test:integration`) startet einen echten js-controller.
  Das dauert und braucht Netzwerk — beim ersten Mal lokal laufen lassen.
- **Zustandsnamen** liegen in Englisch und Deutsch vor. Die Admin-Oberfläche ist
  vollständig in 11 Sprachen. Weitere Sprachen für die Zustandsnamen wären
  in `src/lib/fields.ts` als zusätzliche `nameXx`-Felder zu ergänzen.
