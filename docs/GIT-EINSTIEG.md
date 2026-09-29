# Git-Einstieg für dieses Projekt

Du brauchst dafür **keine Kommandozeile**. Mit GitHub Desktop klickst du alles zusammen.

## Was ist was?

- **Git** speichert jede Version deines Projekts (wie „Speicherstände" in einem Spiel). Du kannst jederzeit zurückspringen.
- **GitHub** ist die Webseite, auf der dein Projekt online liegt (Backup, Veröffentlichung, Issues).
- **Commit** = ein Speicherstand mit kurzer Beschreibung („Wände im Hologramm-Look").
- **Push** = Speicherstände zu GitHub hochladen. **Pull** = Änderungen von GitHub holen.

## Einmalige Einrichtung (ca. 10 Minuten)

1. Konto auf [github.com](https://github.com) anlegen.
2. [GitHub Desktop](https://desktop.github.com) installieren und mit dem Konto anmelden.
3. Die ZIP entpacken. Der Ordner `ha-floorplan-3d` enthält bereits einen Git-Verlauf (den ersten Commit habe ich schon angelegt).
4. In GitHub Desktop: **File → Add local repository** und den Ordner wählen.
5. **Publish repository** klicken. Name `ha-floorplan-3d`. Wenn du das Projekt später öffentlich machen willst, das Häkchen „Keep this code private" entfernen (das geht auch nachträglich in den GitHub-Einstellungen).

Ab jetzt liegt alles online.

## Dein Alltag: der Kreislauf

1. **Ändern:** Dateien im Ordner bearbeiten (z. B. mit [VS Code](https://code.visualstudio.com)) oder eine neue Version von mir einspielen.
2. **Ansehen:** GitHub Desktop zeigt links alle geänderten Dateien und rechts genau, was sich geändert hat (grün = neu, rot = entfernt).
3. **Commit:** Unten links eine kurze Beschreibung eintippen, **Commit to main** klicken.
4. **Push:** Oben auf **Push origin** klicken.

Faustregel: lieber oft und klein committen als selten und riesig. Ein Commit pro Feature oder Fehlerbehebung.

### Gute Commit-Beschreibungen

```
Hologramm-Theme: transparente Wände mit Neon-Kanten
Fehler behoben: Dialog schließt im imperialen Modus nicht
Raum-Pillen zur Navigation hinzugefügt
```

## Wenn etwas schiefgeht

- **Änderung verwerfen, die noch nicht committet ist:** In GitHub Desktop Rechtsklick auf die Datei → *Discard changes*.
- **Einen Commit rückgängig machen:** Im *History*-Tab Rechtsklick auf den Commit → *Revert changes in commit*. Das legt einen neuen Commit an, der ihn aufhebt. Nichts geht verloren.
- Solange etwas committet und gepusht ist, ist es sicher.

## Größere Änderungen: Branches

Wenn du etwas Riskantes ausprobieren willst, ohne dass `main` kaputtgeht:

1. **Current Branch → New Branch**, z. B. `holo-design`.
2. Normal arbeiten und committen.
3. Wenn es gut ist: **Branch → Create Pull Request** (oder einfach in `main` zusammenführen). Wenn nicht: Branch löschen, `main` ist unberührt.

Anfangs reicht dir alles auf `main`. Branches lohnen sich, sobald das Projekt Nutzer hat.

## Versionen veröffentlichen

1. Version in `floorplan3d/config.yaml` erhöhen (z. B. `0.3.0`) und `CHANGELOG.md` ergänzen.
2. Committen und pushen.
3. Auf GitHub: **Releases → Draft a new release**, Tag `v0.3.0`, Beschreibung aus dem Changelog kopieren, veröffentlichen.

Home Assistant zeigt Nutzern ein Update an, sobald die `version` in `config.yaml` höher ist als die installierte.

## Zusammenarbeit mit Claude

Zwei einfache Wege:

- **Über den Chat:** Du schickst mir den Stand (ZIP oder die betroffenen Dateien) und beschreibst, was du willst. Ich liefere geänderte Dateien zurück, du kopierst sie in den Ordner, prüfst in GitHub Desktop die Änderungen und committest.
- **Direkt im Repo:** Mit [Claude Code](https://claude.com/claude-code) arbeitet Claude direkt in deinem Projektordner, erstellt Commits und du siehst jede Änderung im Verlauf. Das ist für dauerhafte Entwicklung der bequemere Weg.

Prüfe Änderungen immer kurz in GitHub Desktop, bevor du committest. Das ist dein Sicherheitsnetz.

## Was nicht ins Repo gehört

Passwörter, Tokens und persönliche Daten (z. B. deine echte `layout.json` mit Grundriss deiner Wohnung, wenn das Repo öffentlich ist). Die `.gitignore` schließt schon `data/`, `node_modules/` und ZIP-Dateien aus.
