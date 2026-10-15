![Logo](../../admin/meteonomiqs.png)

# ioBroker.meteonomiqs: Anleitung

Wettervorhersage von **wetter.com** über die [Meteonomiqs Public Weather API v4.0](https://doc.meteonomiqs.com/doc/forecast_v4_0.html).

Bis zu 14 Tage Vorhersage, Tagesabschnitte, Stundenwerte, die laufende Stunde, Wetterwarnungen, Sonne und Mond. Alles kommt aus **einem** API-Aufruf pro Abruf, und der Adapter ist so gebaut, dass der kostenlose Tarif (100 Aufrufe im Monat) reicht.

English version: [README.md](../../README.md)

---

## Schnellstart

1. Kostenlosen API-Schlüssel bei [Meteonomiqs](https://www.meteonomiqs.com/de/wetter-api/) holen.
2. Prüfen, ob in ioBroker unter *Einstellungen → System → Standort* dein Standort eingetragen ist.
3. Adapter im Admin installieren (Reiter *Adapter*, nach „meteonomiqs" suchen).
4. Instanzeinstellungen öffnen, den Schlüssel bei **API-Schlüssel** einfügen und *Speichern und schließen* klicken.
5. Fertig. Der Adapter ruft die Vorhersage sofort ab und danach dreimal am Tag. Die Werte stehen im Objektbaum unter `meteonomiqs.0`.

Die Standardwerte sind so gewählt, dass du sonst nichts ändern musst. Die Abschnitte unten erklären, was jede Einstellung macht, falls du doch etwas anpassen willst.

---

## Einstellungen

Die Instanzeinstellungen haben vier Reiter. Jeder Abschnitt hier entspricht einem Reiter.

### Reiter „Allgemein"

| Einstellung | Standard | Was sie bewirkt |
|---|---|---|
| API-Schlüssel | leer | Dein Meteonomiqs-Schlüssel. **Pflicht.** Wird verschlüsselt gespeichert. |
| Standort aus den ioBroker-Systemeinstellungen verwenden | an | Breiten- und Längengrad kommen aus *Einstellungen → System → Standort*. Ausschalten, um die Koordinaten selbst einzugeben. |
| Breitengrad / Längengrad | – | Nur, wenn die Option darüber aus ist. Dezimalgrad, z. B. `51.257` / `6.403`. |
| Sprache der Wettertexte | Systemsprache | Sprache der Beschreibungen wie „leicht bewölkt". Nicht unterstützte Sprachen fallen auf Deutsch zurück. |
| Vorhersage-Tage | 7 | 1 bis 14. Mehr Tage bedeuten mehr Objekte, aber keine zusätzlichen API-Aufrufe. Beim Verkleinern werden die nicht mehr benötigten Tagesordner gelöscht. |

### Reiter „Zeitplan"

**Abrufzeiten** ist eine Tabelle: eine Zeile pro Abruf, mit Uhrzeit und Priorität. Jede Zeile kostet einen API-Aufruf pro Tag.

| Uhrzeit | Priorität | Warum diese Uhrzeit |
|---|---|---|
| 01:10 | 1 | Die Vorhersage für den Tag steht, bevor jemand aufsteht |
| 11:40 | 2 | Korrektur vor dem Nachmittag: Gewitter, Böen, Hitze |
| 18:40 | 3 | Nacht und Folgetag: Frost, Sturm, nächster Morgen |

**Was die Priorität bedeutet:** 1 ist der wichtigste Abruf. Werden die Aufrufe des Monats knapp (zum Beispiel, weil du oft auf *jetzt abrufen* gedrückt hast), fällt zuerst der Abruf mit der höchsten Zahl weg, dann der nächste. Priorität 1 läuft am längsten. Mit den drei Standard-Abrufen und dem kostenlosen Tarif passiert das in einem normalen Monat nie.

**Mindestabstand zwischen Abrufen (Stunden)** (Standard 5): Zwei automatische Abrufe liegen nie näher beieinander. Das schützt dein Budget, wenn ioBroker mehrmals hintereinander neu startet. Der Wert muss **kleiner** sein als der kürzeste Abstand zwischen zwei deiner Abrufzeiten, sonst fällt jeden Tag ein Abruf aus. Der Adapter prüft das beim Start und schreibt einen Fehler ins Log, wenn es nicht passt.

> **Gut zu wissen:** Jeder Start der Instanz (Adapter-Update, Neustart des Hosts, Speichern der Einstellungen) ruft einmal sofort ab. Liegt der nächste geplante Abruf weniger als 5 Stunden danach, wird er übersprungen, und das Log sagt es, z. B. `Fetch "11:40" skipped: last fetch 3.0 h ago, minimum gap is 5 h`. Das ist so gewollt.

Jede Installation verschiebt alle Zeiten um dieselben paar Minuten (bis zu 15), damit nicht alle Installationen in derselben Minute bei der API anfragen. Die tatsächlich verwendeten Zeiten stehen beim Start im Log.

### Reiter „API-Budget"

| Einstellung | Standard | Was sie bewirkt |
|---|---|---|
| API-Calls pro Monat | 100 | Das Kontingent deines Tarifs. Der kostenlose Tarif hat 100. `0` schaltet die Prüfung ab (nur für bezahlte Tarife ohne Grenze). |
| Notreserve (Calls) | 5 | Wiederholungsversuche nach einem Fehler hören auf, wenn nur noch so viele Aufrufe übrig sind. So können sie nicht den Rest des Monats aufbrauchen. |
| HTTP-Timeout (Sekunden) | 20 | Wie lange auf die Antwort gewartet wird. Die Antwort ist groß; auf einem langsamen Raspberry Pi nicht unter 20 gehen. |
| Wiederholungsversuche bei Fehlern | 1 | Wie oft nach einem Netzwerkfehler oder Serverfehler (HTTP 5xx) erneut versucht wird. Jeder Versuch kostet einen Aufruf. |

Der Adapter zählt seine Aufrufe selbst, weil die API nicht meldet, wie viele noch übrig sind. Der Zähler ist deshalb eine **Schätzung**. Er beginnt wieder bei 0, wenn du die Instanz löschst und neu anlegst oder auf `info.reset_counter` drückst.

### Reiter „Daten"

Alle Daten kommen aus derselben API-Antwort. Mehr Gruppen einschalten kostet **keine zusätzlichen Aufrufe**, nur mehr Objekte.

| Einstellung | Standard | Was sie bewirkt |
|---|---|---|
| Tagesabschnitte | an | Morgen, Mittag, Abend und Nacht je Tag |
| Stundenwerte | an | Ein Ordner pro Stunde. Erzeugt viele Objekte. |
| Stundenwerte für … Tage | 2 | Jeder Tag bringt rund 620 Objekte |
| Ordner „current" | an | Die Werte der laufenden Stunde. Braucht Stundenwerte. |
| JSON-Aggregate | an | `forecast_json` und `hourly_json` für Widgets |
| Wetterwarnungen | an | Gruppe, Text und Schweregrad 0–4 |
| Sonne und Mond | an | Sonnenauf- und -untergang, Dämmerung, Mondphase, … |
| Luftdruck, Taupunkt, Windchill | an | Zum Vergleich mit einer eigenen Wetterstation oder für Lüftungslogik |
| Schnee | an | Schneefallgrenze und Neuschnee |

Ungefähre Anzahl Objekte bei 7 Vorhersage-Tagen:

| Konfiguration | Objekte |
|---|---|
| Alles an, Stundenwerte für 2 Tage (Standard) | ~2430 |
| Stundenwerte für 1 Tag | ~1780 |
| Stundenwerte aus | ~1130 |
| Nur Tageswerte | ~380 |

Auf einem Raspberry Pi sind Stundenwerte für einen Tag ein guter Kompromiss.

---

## Wo die Werte stehen

```
meteonomiqs.0
├── info
│   ├── connection            Verbindung zur API
│   ├── status                ok / no API key / HTTP 429 / …
│   ├── last_sync             Letzter erfolgreicher Abruf
│   ├── requests_month        Verbrauchte Aufrufe in diesem Monat (Schätzung)
│   ├── requests_left         Restliche Aufrufe in diesem Monat
│   ├── force_update          Knopf: jetzt abrufen (ignoriert den Mindestabstand)
│   └── reset_counter         Knopf: Monatszähler auf 0 setzen
├── current                   Die laufende Stunde, stündlich aktualisiert
│   ├── temp, weather_text, weather_icon, is_night, …
│   ├── temp_min_today, temp_max_today, sunrise, sunset
│   ├── valid                 false, wenn für diese Stunde keine Daten da sind
│   └── source                Aus welchem Datenpunkt die Werte kopiert wurden
├── day_0 … day_N             day_0 = heute, day_1 = morgen, …
│   ├── date, day_name, temp_min, temp_max, weather_icon, wind_bft, …
│   ├── warn_active, warn_severity_int
│   ├── astro                 Sonnenauf- und -untergang, Mondphase, Tageslänge …
│   ├── spaces                morning, afternoon, evening, night
│   └── hourly                00 … 23
├── forecast_json
└── hourly_json
```

Für die meisten Visualisierungen reichen `current` und `day_0` bis `day_2`.

Zwei Dinge, die oft überraschen:

- **`day_N.spaces.night` ist die Nacht *nach* diesem Tag.** `day_0.spaces.night.temp_min` ist also der Tiefstwert der kommenden Nacht, nicht der letzten.
- **Das Wind-Symbol kann ohne Warnung erscheinen.** Die API kennzeichnet starken Wind im Symbol (`d_w_60.svg` statt `d_60.svg`), unabhängig von den amtlichen Warnungen. `wind_significant` zeigt, wann das der Fall ist.

`current` ist die **Vorhersage** für die laufende Stunde, kein Messwert.

---

## Hilfe bei Problemen

| Du siehst | Bedeutung und was zu tun ist |
|---|---|
| `info.status` = `no API key` | Kein Schlüssel eingetragen oder zu kurz. Im Reiter *Allgemein* eintragen. |
| `info.status` = `HTTP 401 — invalid key` oder `HTTP 403 — invalid key` | Die API hat den Schlüssel abgelehnt. Automatische Abrufe pausieren, bis er korrigiert ist. Schlüssel im Meteonomiqs-Portal prüfen und die Einstellungen neu speichern. |
| `info.status` = `no location` | Der Systemstandort fehlt. Unter *Einstellungen → System → Standort* eintragen oder Koordinaten von Hand eingeben. |
| `info.last_sync` ändert sich nach einem Neustart nicht | Meist der Mindestabstand (siehe *Zeitplan*). Im Log steht `… skipped: last fetch … h ago`. Der nächste Abruf läuft normal. |
| Log: `Configuration problem: the cooldown … is greater than or equal to the smallest gap …` | Der *Mindestabstand zwischen Abrufen* ist für deine Abrufzeiten zu groß. Verkleinern. |
| Log: `Budget warning: … fetches per day add up to …` | Deine Abrufzeiten brauchen mehr Aufrufe, als dein Tarif hat. Abrufe mit hoher Prioritätszahl fallen gegen Monatsende weg. Eine Zeit entfernen oder so lassen. |
| Log: `Saving mode: … skipped` oder `Emergency mode: … skipped` | Die Aufrufe des Monats werden knapp, weniger wichtige Abrufe pausieren. Ab dem 1. des nächsten Monats wieder normal. |
| `info.status` = `HTTP 429 — quota exhausted` | Laut API sind deine Aufrufe für diesen Monat aufgebraucht. Der Adapter pausiert bis zum 1. |
| `info.requests_month` weicht vom Meteonomiqs-Portal ab | Der Zähler ist eine Schätzung (siehe *API-Budget*). Das Portal hat recht. |
| `current` bleibt leer | `current` braucht Stundenwerte. Im Reiter *Daten* die *Stundenwerte* einschalten. |
| Der Admin wird langsam, sehr viele Objekte | Stundenwerte ausschalten oder auf einen Tag reduzieren (siehe *Daten*). |

Fragen und Rückmeldungen: [Thread im ioBroker-Forum](https://forum.iobroker.net/topic/85314) oder [GitHub-Issues](https://github.com/Schimi1983/ioBroker.meteonomiqs/issues).

Technische Details (Budget-Stufen, Zeitversatz, Funktionsweise von `current`) stehen in der [englischen README](../../README.md#how-it-works-in-detail).

---

Wetterdaten © [wetter.com GmbH / Meteonomiqs](https://www.meteonomiqs.com). Dieser Adapter steht in keiner Verbindung zu wetter.com.
