# Ideen: die Raumkarte neu (Beispielbilder, 2026-11-14)

Bitte des Besitzers (mit einem Foto seiner Karte „SZFL“ am Handy): „ein paar Designvorschläge für, wenn ich auf einen Raum drauf drücke,
diese Raumkarte … dass du da mal eine neue Ansicht machst, die vielleicht schöner aussieht, einfacher zu bedienen ist, visuell
ansprechender … zauber mal irgendwas.“

Die Bilder sind die echte Demo (5.9.2, Wohnzimmer, 21:30 Uhr, zwei Lichter aus); die Entwürfe sind nur fürs Foto hineingemalt
(`mockup.js` liest die Zeilen der heutigen Karte und zeichnet sie neu). Gemacht mit `python3 docs/ideen-5.10/make_pictures.py <ordner>`,
dann `python3 docs/ideen-5.10/to_jpg.py <ordner> docs/ideen-5.10` (JPG mit großer Nummer, rot = heute, grün = neu).

**Was heute stört** (Bilder 1–3): die Karte ist im Wohnzimmer drei Handy-Bildschirme lang; am Handy steht die Heizung oben und
die Lichter erst nach langem Wischen; Szenen und „Alle aus“ stehen doppelt da, die Szenen unten mit einem Datum wie
„2026-11-13T22:23:31.697Z“ (#750); Farbe und Weißton für den ganzen Raum nehmen viel Platz, obwohl man sie selten braucht;
Werte wie Temperatur, CO₂, Strom sind lange Zeilen; am PC sind es zwei Kästen (Heizung links daneben).

**Was alle Entwürfe gemeinsam haben:** oben ein Kopf mit Symbol des Raums und „💡 3 von 5 an“; die Werte als kleine Chips
(🌡 21,4 °C · 💧 48 % · 🫧 920 ppm in Gelb, weil schon etwas hoch · ⚡ 168 W · 🪟 3 offen in Rot); jede Szene nur einmal, als
Knopf mit Symbol; Farbe und Weißton erst auf Wunsch; die Heizung in derselben Karte (auch am PC nur ein Kasten).

| Idee | Bilder | Was |
|---|---|---|
| ① Kacheln | `04`, `05` | Wie Apple Home / Google Home: jedes Gerät eine Kachel mit Symbol, Name und Zustand. Was an ist, leuchtet warm gelb, unten ein Balken für die Helligkeit. Tippen = an/aus, „›“ = Helligkeit und Farbe. Heizung (− 22° +) und Rollladen (▲ ■ ▼ mit kleinem Fenster-Bild) als breite Kacheln, darunter Geräte (Fernseher, Lautsprecher, Ventilator) und Fenster & Türen mit Farbe (rot offen, orange gekippt, grün zu). |
| ② Große Schieber | `06`, `07` | Wie das Kontrollzentrum am iPhone: ein dicker Schieber „Alle Lichter 77 %“ zum Wischen, darunter Farbe / Weißton / Alle aus. Der Rollladen als Fenster, vor dem der Panzer wirklich so weit herunter ist; die Heizung als runder Regler. Jedes Licht ein eigener dicker Schieber, Szenen als große Knöpfe, Musik mit ⏮ ⏸ ⏭. |
| ③ Reiter | `08`, `09`, `10` | Oben Reiter mit Symbol und Zahl: 💡 Licht 3/5 · 🪟 Rollo 60 % · 🌡 Klima 21,4° · 📺 Geräte 3 · 🚪 Fenster 3 offen (roter Punkt). Man sieht nur einen Reiter: kein langes Wischen. Licht: jede Zeile ist zugleich der Helligkeits-Schieber (die Farbe füllt die Zeile), rechts der Schalter. Klima: „Jetzt 21,4°“ groß, „Ziel − 22° +“, Aus / Heizen / Auto, Vorwahl mit Symbolen, die Werte des Raums als Kästchen. |
| ④ Am Handy erst kurz | `11`, `12` | Die Karte kommt zuerst klein: Kopf, Werte und vier große Knöpfe (💡 Licht, Szenen, 🪟 Rollo, 🌡 Heizung); das Haus bleibt groß zu sehen. Hochziehen am Griff zeigt alles (Bild 12, hier mit den Kacheln von ①). Geht mit ①, ② oder ③ zusammen. |
| ⑤ Kleiner Grundriss | `13`, `14` | Oben in der Karte der Raum von oben: Lampen dort, wo sie stehen, an = leuchtend gelb mit Lichtschein; Fernseher, Lautsprecher, Ventilator, Thermostat (21,4°) und Rollladen (60 %) als runde Knöpfe zum Antippen; Fenster blau, offen rot, gekippt orange; offene Türen als roter Bogen. Darunter Szenen, Alle an / Alle aus und eine Zeile Licht · Rollo · Heizung. |

Seine Wahl: offen.
