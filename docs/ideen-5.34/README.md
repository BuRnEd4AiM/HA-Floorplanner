# Ideen 5.34: Platzhalter in den Texten einer Bildkarte mit einem Tipp einsetzen

Anlass: der Besitzer (2026-11-24): „ich weiß aktuell nicht, wie die Meldungen gemacht werden, ob das Variablen/Platzhalter sind … wenn ich
nur Raum reinschreibe, es einen Raum nimmt, und Lampe oder was anderes, dass dann das angezeigt wird, was in der Warnung angezeigt wird“.
Seine Antwort auf die Frage „Knöpfe einbauen?“: erst ein Beispielbild.

Heute (5.33.1) geht das schon, nur mit geschweiften Klammern von Hand: `{raum}`, `{etage}`, `{melder}`, `{zeit}`, `{art}`, `{haus}`, `{text}`.
Die Bilder zeigen, wie man sie ohne Klammern tippen einsetzen könnte. Nur fürs Foto in den echten Editor der Demo gemalt (`make_pictures.py`);
die Karte rechts ist echt. Grün = neu.

| Bild | Für | Was |
| --- | --- | --- |
| 1 | Idee 1 | **Knöpfe unter dem Feld:** „＋ Raum“, „＋ Etage“, „＋ Melder“, „＋ Uhrzeit“, „＋ Art“, „＋ Haus“, „＋ Nachricht“, klein daneben ein Beispiel. Ein Tipp setzt `{raum}` an der Stelle vom Strich ein; rechts sofort, was daraus wird |
| 2 | Idee 2 | **Dieselben Knöpfe, im Feld aber grüne Kästchen** („Raum“, „Uhrzeit“) statt Klammern; ⌫ löscht ein Kästchen ganz |
| 3 | beide | So kommt die Karte im Handy an: „Wasser in Waschküche (Keller) um 11:46. Gemeldet von Keller Luftfeuchte.“ |

Neu machen (Demo vorher bauen: `cd demo && npm ci && node build.mjs`, danach `git checkout demo/floorplan3d-demo.html`):

    python3 docs/ideen-5.34/make_pictures.py <ordner>
    python3 docs/ideen-5.34/to_jpg.py <ordner> docs/ideen-5.34
