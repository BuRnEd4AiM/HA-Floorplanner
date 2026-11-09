# Antwort auf #691: Keller halb aus der Erde

Die Bilder in der Antwort auf [#691](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/691) (2026-11-09). Die Frage: ein Keller, der zur Hälfte aus der Erde schaut. Das geht seit 4.58.0 mit einem einzigen Höhenpunkt in „Grundstück“ → „⛰ Gelände“. Die Bilder sind auf Englisch, wie die Frage, und zeigen die Zahlen aus seinem Beispiel: Geschosshöhe 2,75 m, der Höhenpunkt auf −1,50 m (der Kellerboden liegt dann 1,25 m unter dem Rasen).

- `1-storey-height.jpg`: „Manage floor“ → „Storey height (whole house)“
- `2-terrain-one-point.jpg`: „Plot“ → „⛰ Terrain“, ein Tipp in den Plan, die Höhe −1.5
- `3-before-after.jpg`: das ganze Haus vorher (Rasen auf 0) und nachher

Gemacht mit der Demo (`demo/floorplan3d-demo.html`, Version 5.2.2) und Playwright:

    NODE_PATH=$(npm root -g) node docs/antworten/691/make_pictures.js <Ordner>

(das Skript macht PNG; die JPG und das zusammengesetzte Vorher/Nachher-Bild entstanden danach mit Pillow).
