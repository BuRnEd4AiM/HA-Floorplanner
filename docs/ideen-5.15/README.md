# Ideen: neun neue Funktionen (Beispielbilder, 2026-11-17)

Frage des Besitzers: „kann man noch andere sachen hinzufüegen die eine großen benefit haben könnten?“ Claude bot in drei
Runden Ideen an, die es noch nicht gibt (vorher im CHANGELOG nachgesehen: Tag abspielen, Farbansichten, Bauplan als Vorlage,
Regenwarnung, Kosten gibt es schon). Seine Wahl: alle neun unten.

Die Bilder sind die echte Demo (5.14.1, Erdgeschoss, Blick von Süden); die Ideen sind nur fürs Foto hineingemalt (`mockup.js`:
Karten und Schilder über dem 3D-Bild, ein Schild sitzt dort, wo das Gerät im Bild ist). Gemacht mit
`python3 docs/ideen-5.15/make_pictures.py <ordner>`, dann `python3 docs/ideen-5.15/to_jpg.py <ordner> docs/ideen-5.15`
(JPG mit großer Nummer, grün = neu). Alle Zahlen sind ausgedacht.

| Idee | Bilder | Was |
|---|---|---|
| ① ☀ Rollläden nach der Sonne | `01`, `02` | Das Haus kennt die Richtung jedes Fensters und den Sonnenstand: nur der Rollladen, auf dessen Fenster die Sonne scheint, fährt runter (auf 30 %), die im Schatten bleiben oben. Einstellungen: Sonne höher als, draußen / im Raum wärmer als, wie weit, wieder hoch nach; die Fenster mit ihrer Richtung und „jetzt Sonne“. |
| ② 📡 Funk-Karte | `03` | Jedes Zigbee-, Z-Wave-, WLAN- oder Bluetooth-Gerät als Punkt in seiner Farbe (grün gut, gelb mittel, rot schwach mit dBm); die schwächsten in einer Liste, ein Tipp, wo ein Verstärker hilft. |
| ③ 📸 Bild bei Alarm | `04`, `05` | Wassermelder, Rauchmelder, Alarm: die Nachricht aufs Handy hat ein Bild vom Haus mit dem roten Ring um die Stelle, dazu „Im Haus zeigen“ und eine Aktion („Wasser zu“). |
| ④ 🔌 Stromfresser | `06` | Was das Haus nachts zieht (2–5 Uhr), in Watt und Euro im Jahr; die Geräte mit Standby rot im Haus; „Nachts abschalten …“. |
| ⑤ 🏠 Urlaubs-Licht | `07` | Sind alle weg, gehen Lichter und Rollläden abends wie bei euch an und aus, gelernt aus den letzten 14 Tagen; der Plan des Abends als Balken. |
| ⑥ 🌙 Nachtlicht-Weg | `08` | Nachts bei Bewegung am Bett nur ein schwaches Licht auf dem Weg (Flur 10 %, Bad 20 %); der Weg wird im Plan gezogen. |
| ⑦ 🔧 Wartung | `09` | Erinnerungen am Gerät im Haus und aufs Handy: Filter, Bürste, Heizkörper entlüften, Rauchmelder testen, Batterie; „✓ Erledigt“ startet neu. |
| ⑧ 👥 Gäste-Modus | `10` | Ein Schalter, solange Besuch da ist: Gästezimmer heizt, Flurlicht nachts, Gast-Tablet mit wenigen Rechten, Alarm nur außen, das Gast-WLAN als QR-Code. |
| ⑨ 📊 Monatsbericht | `11` | Jeden Monat eine Nachricht: Heizung und Strom je Raum in Euro, ein Bild vom Haus, der Vergleich zum Vorjahr. |

Seine Wahl, was zuerst gebaut wird (2026-11-17): ① Sonnenschutz, dazu „die Ausrichtung am Kompass anpassen ohne das Haus neu zu zeichnen“ und „pass auf das die regeln sich dann nicht beißen“. Gebaut in 5.15.0 (`sunshade.py`, `sunshadeui.js`). Die anderen acht kommen danach.
