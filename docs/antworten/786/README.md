# Antwort auf #786: Haus 65 cm über dem Rasen

Die Bilder in der Antwort auf [#786](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/786) (2026-11-22, Version 5.29.0). Die Frage: ein Reihenhaus, dessen Erdgeschoss 65 cm über der Straße liegt, der Garten hinten etwas tiefer. Das geht schon mit einem **Plateau** unter dem Haus (Höhe 0,65 m, dazu „＋ Außentreppe an die Haustür“) und für den Garten mit **„⛰ Gelände“**. Die Bilder sind auf Deutsch (er schreibt Deutsch) und zeigen ein nachgebautes Reihenhaus 6 × 10 m ohne Keller (sonst schneidet „Ganzes Haus“ die Erde vorne auf).

- `1-plateau-anlegen.jpg`: „Grundstück“ → „▲ Plateau unter das ganze Haus“ → „Anlegen“
- `2-hoehe-treppe.jpg`: „Höhe über dem Rasen“ 0,65 und „＋ Außentreppe an die Haustür“
- `3-vorher-nachher.jpg`: das Haus vorher und nachher
- `4-gelaende.jpg`: „⛰ Gelände“, vorne 0, hinten −0,30 m
- `5-garten.jpg`: von hinten, der Garten 30 cm tiefer

Lichtschächte gab es da noch nicht; gebaut in 5.31.0 (von selbst vor jedem Kellerfenster unter dem Boden).

Gemacht mit der Demo (`demo/floorplan3d-demo.html`) und Playwright:

    NODE_PATH=$(npm root -g) node docs/antworten/786/make_pictures.js <Ordner>

(das Skript macht PNG; die JPG mit Beschriftung entstanden danach mit Pillow).
