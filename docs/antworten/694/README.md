# Antwort auf #694: Fenster über der Terrassentür

Die Bilder in der Antwort auf [#694](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/694) (2026-11-10). Der Wunsch: über jeder Terrassentür ein eigenes, hoch liegendes Fenster gleicher Breite, mit Wand dazwischen, jedes mit eigenem Rollladen. Gebaut in 5.3.0. Die Bilder sind auf Deutsch, wie die Frage, und zeigen seine Zahlen: Wand 3,60 m hoch, Terrassentür 1,60 × 2,20 m (als bodentiefes Fenster: nur ein Fenster hat einen Rollladen), das Fenster darüber ab 2,95 m, 0,65 m hoch, seine Entitäten (`cover.jalousie_terrasse_links`, `cover.lichterbereich_terrasse_links` …).

- `1-fenster-darueber.jpg`: die rechte Terrassentür gewählt, „＋ Fenster darüber“
- `2-ergebnis.jpg`: beide Türen mit Fenster darüber, Wand dazwischen; links der Rollladen der Tür halb zu, der darüber ganz zu, rechts beide offen; das Fenster oben links gewählt, „⇅ Darunter: Terrassentür links“

Gemacht mit der Demo (`demo/floorplan3d-demo.html`, Version 5.3.0) und Playwright, ohne die Werte-Schilder (das Schild des unteren Rollladens stand in 5.3.0 vor dem Fenster darüber):

    python3 docs/antworten/694/make_pictures.py <Ordner>

(das Skript macht PNG; die JPG entstanden danach mit Pillow, unten 30 Pixel abgeschnitten).
