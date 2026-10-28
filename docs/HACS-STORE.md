# Die Karte in den offiziellen HACS-Store bringen

Heute findet man die Karte „3D Floorplan Card“ in HACS nur, wenn man dieses Projekt vorher als **benutzerdefiniertes Repository** einträgt. Im offiziellen Store (der „Standard-Liste“ von HACS) findet sie jeder direkt mit der Suche. Diese Datei sagt, was dafür nötig ist und was schon erledigt ist.

## Was HACS verlangt, und wie es bei uns steht

| Was | Stand |
|---|---|
| Öffentliches Repository auf GitHub, nicht archiviert, Issues eingeschaltet | ✅ |
| Beschreibung des Repositorys (HACS zeigt sie im Store an) | ✅ seit 2026-10-28 die neue Beschreibung (Schritt 1) |
| Stichwörter (Topics) | ✅ (addons, dashboard, floorplan, home-assistant, json-api, kioskbrowser) |
| README mit Anleitung und Bildern | ✅ |
| `hacs.json` mit Name und Datei der Karte | ✅ (`3D Floorplan Card`, `floorplan3d-card.js`) |
| Die Karte als Datei in `dist/` | ✅ `dist/floorplan3d-card.js` |
| Richtige Releases (nicht nur Tags), mit der Karte als Anhang | ✅ macht der Workflow „Release“ bei jeder neuen Version |
| Lizenz | ✅ MIT |
| Die Prüfung von HACS (`hacs/action`) läuft im eigenen Repository, **ohne** abgeschaltete Prüfungen | ✅ neu: Workflow „Validate“ (`.github/workflows/validate.yml`), täglich, bei jedem Push nach `main` und bei jedem Pull Request |
| Ein neues Release, **nachdem** „Validate“ grün war | ✅ (z. B. 4.38.1 nach dem grünen Lauf https://github.com/BuRnEd4AiM/HA-Floorplanner/actions/runs/40679623292) |
| Den Antrag stellt der **Besitzer** selbst (ein Pull Request an `hacs/default`) | ✅ gestellt am 2026-10-28, alle Prüfungen grün; wartet auf die Freigabe durch das HACS-Team |

## Schritt 1: die Beschreibung verbessern (2 Minuten)

1. https://github.com/BuRnEd4AiM/HA-Floorplanner öffnen.
2. Rechts bei „About“ auf das Zahnrad ⚙ tippen.
3. Bei „Description“ eintragen (HACS zeigt den Text auf Englisch an, so wie die anderen Karten):

   `3D floor plan for Home Assistant: draw your home, see it in 3D and control your devices right where they are (add-on and dashboard card)`

4. Bei „Topics“ dazu schreiben (hilft bei der Suche): `hacs`, `lovelace`, `lovelace-card`, `home-assistant-addon`
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
