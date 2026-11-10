# Antwort auf #703: Terrasse halb auf der Garage, halb frei

Die Bilder für die Antwort auf [#703](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/703) (2026-11-10, Version 5.3.2). Das Haus wie in der Meldung: am Hang, im Keller Hobbyraum und Garage (`raise: -0.5`, Gelände vor dem Tor −3,15 m), im Erdgeschoss das Wohnzimmer und eine Terrasse, die auf der Garage liegt und 2 m nach vorne hinausragt, vor dem Wohnzimmer über das Fenster des Hobbyraums.

- `vorher.jpg`: 5.3.1: unter dem hinausragenden Streifen ein grauer Sockel bis zum Boden, Kellerfenster und Garagentor sind verdeckt.
- `nachher.jpg`: 5.3.2: der Streifen hängt frei auf einer dünnen Platte, Fenster und Tor sind zu sehen.

Gemacht mit `make_pictures.py <ordner mit venv/old> <ausgabe>`: startet den nachgebauten Home Assistant und zwei Add-ons (alt = `origin/main` als `git worktree` in `<ordner>/old`, neu = dieser Stand), spielt denselben Plan ein und fotografiert beide aus derselben Richtung; danach auf das Haus zugeschnitten (JPG, Qualität 82).
