# Die Karte in den offiziellen HACS-Store bringen

**Geschafft am 2026-11-12:** Frenck vom HACS-Team hat den Antrag gemergt; `BuRnEd4AiM/HA-Floorplanner` steht in der Standard-Liste von HACS (Datei `plugin`). Jeder findet die Karte jetzt mit der Suche nach „3D Floorplan Card“ (sobald HACS seine Liste neu geladen hat, das dauert manchmal ein paar Stunden). Sein Hinweis: in der Anleitung zuerst die Suche nennen, das benutzerdefinierte Repository nur als Ausweg (seit 5.9.0 so in README, DOCS und der Tablet-Anleitung).

**Folge für Docker (#744):** HACS kennt ein Repository nur unter einer Art. Weil dieses jetzt als „Dashboard“ im Store steht, lässt HACS es nicht mehr als „Integration“ hinzufügen („exists in the store“). Darum bekommt die Integration für Docker ein eigenes Repository: **Schritt 4** unten.

Was folgt, ist die Geschichte des Antrags (zum Nachlesen).

## Was HACS verlangt, und wie es bei uns steht

| Was | Stand |
|---|---|
| Öffentliches Repository auf GitHub, nicht archiviert, Issues eingeschaltet | ✅ |
| Beschreibung des Repositorys (HACS zeigt sie im Store an) | ⏳ neue Beschreibung „More than a floor plan …“ (2026-11-05, Schritt 1) zum Eintragen |
| Stichwörter (Topics) | ✅ 12 Stück; ⏳ 8 neue zum Eintragen (2026-11-05, Schritt 1) |
| README mit Anleitung und Bildern | ✅ |
| `hacs.json` mit Name und Datei der Karte | ✅ (`3D Floorplan Card`, `floorplan3d-card.js`) |
| Die Karte als Datei in `dist/` | ✅ `dist/floorplan3d-card.js` |
| Richtige Releases (nicht nur Tags), mit der Karte als Anhang | ✅ macht der Workflow „Release“ bei jeder neuen Version |
| Lizenz | ✅ GPL-3.0 (seit 2026-11-03, bis 4.61.0 MIT; HACS verlangt keine bestimmte Lizenz) |
| Die Prüfung von HACS (`hacs/action`) läuft im eigenen Repository, **ohne** abgeschaltete Prüfungen | ✅ neu: Workflow „Validate“ (`.github/workflows/validate.yml`), täglich, bei jedem Push nach `main` und bei jedem Pull Request |
| Ein neues Release, **nachdem** „Validate“ grün war | ✅ (z. B. 4.38.1 nach dem grünen Lauf https://github.com/BuRnEd4AiM/HA-Floorplanner/actions/runs/40679623292) |
| Den Antrag stellt der **Besitzer** selbst (ein Pull Request an `hacs/default`) | ✅ gestellt am 2026-10-28, gemergt am 2026-11-12 (Frenck) |

## Schritt 1: die Beschreibung verbessern (2 Minuten)

1. https://github.com/BuRnEd4AiM/HA-Floorplanner öffnen.
2. Rechts bei „About“ auf das Zahnrad ⚙ tippen. (Am Handy in Safari: wenn „About“ fehlt, unten links „aA“ → „Desktop-Website anfordern“.)
3. Bei „Description“ eintragen (HACS zeigt den Text auf Englisch an, so wie die anderen Karten):

   `More than a floor plan: your smart home in 3D for Home Assistant. Draw it or let an AI build it, then run lights, heating, energy, security, cameras and routines right where they are, with ready-made dashboard pages. Add-on, Docker and dashboard card – try the demo in your browser.`

   (Neu seit 2026-11-05, Wunsch des Besitzers: man soll gleich sehen, dass es mehr als ein Grundriss ist. Davor seit 2026-11-03: „Your home in 3D for Home Assistant: draw it or let an AI build it from a description, then control lights, windows, heating and scenes right where they are. With dashboard pages for energy, climate, cameras and more. Add-on, Docker and dashboard card – try the demo in your browser.“ Höchstens 350 Zeichen.)

4. Bei „Topics“ stehen (hilft bei der Suche): `addons`, `dashboard`, `docker`, `floorplan`, `hacs`, `home-assistant`, `homeassistant-addons`, `json-api`, `kioskbrowser`, `lovelace-card`, `smart-home`, `threejs`. **Neu dazu (2026-11-05)**, damit man das Projekt auch findet, wenn man nach Heizung, Strom oder Sicherheit sucht: `3d`, `home-automation`, `energy-monitoring`, `heating-control`, `security`, `automation`, `voice-control`, `wall-tablet` (dann sind es 20, mehr erlaubt GitHub nicht).
5. „Save changes“.

## Schritt 2: warten, bis „Validate“ grün ist und ein neues Release da ist

- Nach dem Merge läuft unter **Actions → Validate** die Prüfung von HACS. Sie muss grün sein (✓).
- HACS will ein Release, das **nach** einer grünen Prüfung gemacht wurde. Das passiert von selbst mit der nächsten Version (z. B. 4.3.1 oder 4.4.0). Claude sagt Bescheid, wenn es so weit ist.

## Schritt 3: den Antrag stellen (nur der Besitzer)

HACS nimmt den Antrag nur vom Besitzer des Repositorys an, darum musst du ihn selbst stellen. Claude hat dafür keine Rechte.

1. https://github.com/hacs/default öffnen, oben rechts **„Fork“** → „Create fork“.
2. In deinem Fork die Datei **`plugin`** öffnen, auf den Stift ✏️ tippen.
3. Die Liste ist nach dem Alphabet sortiert (Groß- und Kleinschreibung egal). Suche die Zeile `"BTNBx/xPower-Flow-Card",` und füge **direkt darunter** ein:

   ```
     "BuRnEd4AiM/HA-Floorplanner",
   ```

   Danach kommt `"c-kick/hnl-flow-bars-card",`. Genau so schreiben, mit Anführungszeichen und Komma, gleich weit eingerückt wie die anderen Zeilen.
4. Unten „Commit changes“ → „Create a new branch …“ wählen → „Propose changes“.
5. **„Create pull request“**. Der Text des Antrags ist eine Vorlage mit Häkchen; so ausfüllen:

   ```
   ## Checklist

   - [x] I've read the [publishing documentation](https://hacs.xyz/docs/publish/start).
   - [x] I've added the [HACS action](https://hacs.xyz/docs/publish/action) to my repository.
   - [ ] (For integrations only) I've added the [hassfest action](https://developers.home-assistant.io/blog/2020/04/16/hassfest/) to my repository.
   - [x] The actions are passing without any disabled checks in my repository.
   - [x] I've added a link to the action run on my repository below in the links section.
   - [x] I've created a new release of the repository after the validation actions were run successfully.

   ## Links

   Link to current release: https://github.com/BuRnEd4AiM/HA-Floorplanner/releases/latest
   Link to successful HACS action (without the `ignore` key): <Link zum grünen Lauf unter Actions → Validate>
   Link to successful hassfest action (if integration): not an integration (dashboard card)
   ```

   Den Link zum grünen Lauf bekommst du so: Actions → Validate → den obersten grünen Lauf öffnen → die Adresse oben kopieren.
6. **Keine** Reviewer anfragen (das steht ausdrücklich in der Vorlage, sonst wird der Antrag geschlossen). Dann heißt es warten: HACS prüft den Antrag selbst, das dauert oft einige Wochen. Ist er gemergt, ist die Karte nach der nächsten Suche von HACS im Store.

## Gut zu wissen

- Wer die Karte schon als benutzerdefiniertes Repository hat, behält sie; nichts ändert sich für ihn.
- Das Add-on selbst (3D Floorplan) gehört nicht in HACS: Add-ons kommen über **Einstellungen → Apps → Store → ⋮ → Repositorys** mit der Adresse dieses Projekts. HACS ist nur für die Karte.
- Es gibt schon andere Grundriss-Karten im Store (z. B. ha-floorplan, easy-floorplan); unsere heißt „3D Floorplan Card“, das ist eindeutig.

## Schritt 4: ein eigenes Repository für den Connector (Docker, #744) – nur der Besitzer, 2 Minuten

Wer Home Assistant als Docker-Container hat, braucht die Integration „3D Floorplan (Container)“ (den „Connector“). HACS soll sie installieren und aktualisieren können. Das geht nur mit einem eigenen Repository (siehe oben). Claude kann keine Repositorys anlegen, darum:

1. https://github.com/new öffnen.
2. Bei **Repository name** eintragen: `HA-Floorplanner-Connector`
3. Bei **Description**: `Home Assistant integration of 3D Floorplan for Home Assistant Container, installed with HACS. Filled automatically from the releases of HA-Floorplanner.`
4. **Public** wählen. Sonst nichts ankreuzen (kein README, keine .gitignore, keine Lizenz).
5. **Create repository**.
6. Claude im Chat sagen: „Repository ist angelegt“. Claude füllt es (Anleitung, `hacs.json`, den Workflow „Sync from HA-Floorplanner“) und startet den ersten Abgleich. Danach holt es sich jede Stunde selbst die neuen Releases von hier.

Gut zu wissen: das Paket (`floorplan3d-connector.zip`) hängt auch ohne dieses Repository an jedem Release. Das fertige Docker-Image legt GitHub unter deinem Profil → **Packages** → `floorplan3d` ab. Sagt der Workflow „Container image“ „not public yet“: dort **Package settings** → **Change visibility** → **Public** (einmal).
