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

## Zweite Antwort (2026-11-23, Version 5.32.0): `2/`

Seine Antwort mit Fotos (Eingang mit 3 Stufen und Geländer links, Vordach, Balkon hinten unter dem Dach, Bild 1 mit dem falschen Schnitt in „Ganzes Haus“). Gebaut in 5.32.0 (#794 für den Schnitt). Die Bilder zeigen sein Reihenhaus nachgebaut (Keller, EG, OG mit Balkon, Dachgeschoss, Dachstuhl; Grundstück so breit wie das Haus, vorne 65 cm tiefer):

- `1-waende-abgesenkt.jpg`, `2-waende-oben.jpg`: „Ansicht“ → „Auto“ aus, „Wände hoch“: die Vorderwand bleibt zu
- `3-gelaende-treppe.jpg`: „Grundstück“ → „⛰ Gelände“, Höhenpunkte, „＋ Außentreppe an die Haustür“
- `4-treppe-felder.jpg`: „Stufen“ 3, „Geländer“ links, „Edelstahl mit Stäben“
- `5-vordach-knopf.jpg`, `6-vordach-felder.jpg`, `7-eingang-3d.jpg`: „＋ Vordach über die Tür“ und das Ergebnis
- `8a`/`8b`/`8c`: der Balkon ohne und mit „Hausdach reicht darüber“
- `9a`/`9b`/`9c`: das Dach oben drauf und „Ausgebauter Dachstuhl“ mit Kniestock 1 m
- `10-ganzes-haus-seite.jpg`: „Ganzes Haus“ von der Seite, der Keller offen (#794)

    NODE_PATH=$(npm root -g) node docs/antworten/786/2/make_pictures.js <Ordner>

(PNG, danach mit Pillow als JPG, halbe Größe, Qualität 80).
