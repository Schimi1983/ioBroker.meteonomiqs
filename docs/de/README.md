![Logo](../../admin/meteonomiqs.png)

# ioBroker.meteonomiqs: Anleitung

Die Wettervorhersage von **wetter.com** in deinem ioBroker: bis zu 14 Tage, Stunde für Stunde, mit Wetterwarnungen, Sonnenauf- und -untergang. Du brauchst nur einen kostenlosen Schlüssel von wetter.com (Meteonomiqs).

English version: [README.md](../../README.md)

---

## Schnellstart

1. Kostenlosen API-Schlüssel bei [Meteonomiqs](https://www.meteonomiqs.com/de/wetter-api/) holen.
2. Prüfen, ob in ioBroker unter *Einstellungen → System → Standort* dein Standort eingetragen ist.
3. Adapter im Admin installieren (Reiter *Adapter*, nach „meteonomiqs“ suchen).
4. Instanzeinstellungen öffnen, den Schlüssel bei **API-Schlüssel** einfügen und *Speichern und schließen* klicken.

Fertig. Der Adapter holt die Vorhersage sofort und danach dreimal am Tag. Die Werte findest du im Reiter *Objekte* unter `meteonomiqs.0`. Sonst musst du nichts einstellen.

---

## Was du bekommst

- **Tagesvorhersage** für bis zu 14 Tage: Temperatur, Regen, Wind, Wolken, Sonnenstunden und mehr
- **Morgen, Mittag, Abend und Nacht** für jeden Tag
- **Stundenwerte** für die nächsten Tage
- **Die aktuelle Stunde** im eigenen Ordner `current`, jede Stunde aktualisiert
- **Wetterwarnungen** mit Text und Stufe 0–4
- **Sonne und Mond**: Sonnenauf- und -untergang, Tageslänge, Mondphase
- **Wettersymbole** von wetter.com, fertig für deine Visualisierung

---

## Die Werte nutzen

Die wichtigsten Datenpunkte:

| Was du wissen willst | Datenpunkt |
| --- | --- |
| Temperatur jetzt | `meteonomiqs.0.current.temp` |
| Wetter jetzt als Text und Symbol | `current.weather_text`, `current.weather_icon` |
| Tiefst- und Höchstwert heute | `day_0.temp_min`, `day_0.temp_max` |
| Regnet es morgen? | `day_1.prec_probability` (in %), `day_1.prec_sum` (in mm) |
| Windstärke | `current.wind_bft` (Beaufort 0–12), `current.wind_gusts` (km/h) |
| Gibt es eine Wetterwarnung? | `day_0.warn_active` (true/false), `day_0.warn_text` |
| Sonnenauf- und -untergang heute | `current.sunrise`, `current.sunset` |

`day_0` ist heute, `day_1` morgen, `day_2` übermorgen und so weiter.

Ein paar Ideen für Skripte oder Blockly:

- **Markise schützen:** einfahren, wenn `current.wind_bft` 6 oder mehr erreicht.
- **Gießen sparen:** den Garten nicht gießen, wenn `day_0.prec_probability` über 70 liegt.
- **Familie warnen:** eine Nachricht schicken, wenn `day_0.warn_active` auf true springt, mit `day_0.warn_text` als Text.

Für Widgets in VIS, Jarvis oder Material steht die ganze Vorhersage in einem Datenpunkt: `forecast_json` (Tage) und `hourly_json` (Stunden von heute).

Alle Werte sind eine **Vorhersage**, keine Messung.

---

## Einstellungen

Die Standardwerte passen zum kostenlosen Tarif. Eintragen musst du nur den API-Schlüssel, alles andere ist freiwillig.

### Reiter „Allgemein“

| Einstellung | Was sie bewirkt |
| --- | --- |
| API-Schlüssel | Dein Schlüssel von Meteonomiqs. **Pflicht.** |
| Standort aus den ioBroker-Systemeinstellungen verwenden | Standardmäßig an. Ausschalten, wenn du das Wetter für einen anderen Ort willst, dann Breiten- und Längengrad eintragen. |
| Sprache der Wettertexte | Sprache von Texten wie „leicht bewölkt“. Leer heißt: die Sprache deines ioBroker. |
| Vorhersage-Tage | 1 bis 14 (Standard 7). Mehr Tage kosten keine zusätzlichen Abrufe. |

### Reiter „Zeitplan“

Wann der Adapter die Vorhersage holt. Standard: **01:10, 11:40 und 18:40**. Jede Zeile kostet einen Abruf pro Tag.

Die **Priorität** sagt, wie wichtig ein Abruf ist. 1 ist der wichtigste. Werden die Abrufe des Monats knapp, fällt zuerst die Zeile mit der höchsten Zahl weg. Mit den Standardzeiten und dem kostenlosen Tarif passiert das in einem normalen Monat nicht.

### Reiter „Monatslimit“

Der kostenlose Tarif erlaubt **100 Abrufe im Monat**. Der Adapter teilt sie selbst über den Monat ein. Die Zahl nur ändern, wenn du einen anderen Tarif hast.

### Reiter „Daten“

Hier wählst du, welche Werte angelegt werden. Mehr einschalten kostet **keine zusätzlichen Abrufe**, nur mehr Datenpunkte. Standardmäßig ist alles an.

| Einstellung | Was sie bewirkt |
| --- | --- |
| Tagesabschnitte | Morgen, Mittag, Abend und Nacht je Tag |
| Stundenwerte | Ein Wert pro Stunde, standardmäßig für 2 Tage. Auf einem Raspberry Pi reicht 1 Tag. |
| Aktuelle Stunde | Der Ordner `current` mit den Werten der laufenden Stunde. Braucht Stundenwerte. |
| Vorhersage als JSON | `forecast_json` und `hourly_json` für Widgets |
| Wetterwarnungen, Sonne und Mond, Luftdruck / Taupunkt, Schnee | Zusätzliche Datenpunkte, abschalten, was du nicht brauchst |

### Experteneinstellungen

Ein paar selten gebrauchte Einstellungen erscheinen nur, wenn im Admin der **Expertenmodus** eingeschaltet ist: der Mindestabstand zwischen zwei Abrufen (Standard 5 Stunden), die Wartezeit auf eine Antwort (20 Sekunden), Wiederholungen nach einem Fehler (1) und die Notreserve (5 Abrufe). Normalerweise brauchst du sie nicht.

---

## Fragen und Probleme

**Nach einem Neustart ändern sich die Werte nicht.**
Das ist so gewollt. Nach jedem Start holt der Adapter einmal sofort die Vorhersage. Käme der nächste geplante Abruf weniger als 5 Stunden später, wird er übersprungen, um Abrufe zu sparen. Im Log steht dann z. B. `Fetch "11:40" skipped …`.

**`info.status` zeigt „no API key“.**
Schlüssel im Reiter *Allgemein* eintragen und speichern.

**`info.status` zeigt „invalid key“.**
Der Schlüssel wurde abgelehnt. Im Meteonomiqs-Konto prüfen, neu eintragen und speichern.

**`info.status` zeigt „no location“.**
Den Standort unter *Einstellungen → System → Standort* eintragen, oder *Standort aus den ioBroker-Systemeinstellungen verwenden* ausschalten und die Koordinaten eingeben.

**Im Log steht „Saving mode“ oder „Emergency mode“.**
Die Abrufe dieses Monats werden knapp, deshalb pausieren weniger wichtige Abrufe. Ab dem 1. des nächsten Monats ist alles wieder normal.

**`info.requests_month` weicht von meinem Meteonomiqs-Konto ab.**
Der Adapter zählt seine Abrufe selbst. Dein Meteonomiqs-Konto hat immer recht.

**Der Ordner `current` bleibt leer.**
Er braucht Stundenwerte. Im Reiter *Daten* die *Stundenwerte* einschalten.

**Der Admin wird langsam.**
Stundenwerte erzeugen viele Datenpunkte. Im Reiter *Daten* auf einen Tag reduzieren oder ausschalten.

Weitere Fragen: [ioBroker-Forum](https://forum.iobroker.net/topic/85314) oder [GitHub-Issues](https://github.com/Schimi1983/ioBroker.meteonomiqs/issues).

Technische Details (alle Datenpunkte, wie das Monatslimit arbeitet) stehen in der [englischen README](../../README.md) unter „For advanced users“.

---

## Unterstützen

Der Adapter ist kostenlos und bleibt es. Wenn er dir nützt und du Danke sagen möchtest, kannst du die Entwicklung unterstützen:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Schimi1983-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Schimi1983)
[![PayPal](https://img.shields.io/badge/PayPal-Spenden-00457C?logo=paypal&logoColor=white)](https://paypal.me/Schimi1983)

Fehlermeldungen und Ideen in den [Issues](https://github.com/Schimi1983/ioBroker.meteonomiqs/issues) helfen genauso.

---

Wetterdaten © [wetter.com GmbH / Meteonomiqs](https://www.meteonomiqs.com). Dieser Adapter steht in keiner Verbindung zu wetter.com.
