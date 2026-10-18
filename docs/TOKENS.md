# Token-Verbrauch von Claude

<!-- Wird von tools/tokens.py erzeugt (Workflow „Token count“ nach jedem Merge). Nicht von Hand ändern. -->

Stand: 2026-10-18 · 52 Sitzungen

**Insgesamt: 3,38 Mrd. Tokens** (davon 2,00 Mrd. geschätzt)

| | Tokens | Was ist das? |
|---|---:|---|
| Geschrieben | 10,0 Mio. | Text, Code und Nachdenken, das Claude neu geschrieben hat |
| Neu gelesen | 39,8 Mio. | Nachrichten, Dateien und Ausgaben, die zum ersten Mal ins Gespräch kamen |
| Wieder gelesen | 3,33 Mrd. | das bisherige Gespräch, das Claude bei jedem Schritt noch einmal liest (die meisten Tokens, aber billig) |

Jede Sitzung schreibt ihre Zahlen bei jedem `git commit` in `docs/tokens/` (egal mit welchem Zugang). Was nach dem letzten Commit einer Sitzung noch verbraucht wird, fehlt; die Zahl ist also eher zu klein.

## Pro Monat

| Monat | Sitzungen | Tokens | davon geschrieben |
|---|---:|---:|---:|
| 2026-10 | 39 | 1,38 Mrd. | 4,0 Mio. |
| geschätzt | 13 | 2,00 Mrd. | 6,0 Mio. |

## Pro Sitzung (neueste zuerst)

| Beginn | Sitzung | Worum es ging | Tokens | davon geschrieben | Quelle |
|---|---|---|---:|---:|---|
| 2026-10-18 | [01UoZhsk…](https://claude.ai/code/session_01UoZhskVzkQSQ3wfn9kvzoS) | claude/ecstatic-curie-689tep | 108,3 Mio. | 289 Tsd. | gezählt |
| 2026-10-18 | [019zzCWW…](https://claude.ai/code/session_019zzCWWeL1ePBsdNchUFqrK) | claude/vigilant-archimedes-biceo2 | 18,1 Mio. | 78 Tsd. | gezählt |
| 2026-10-18 | [01PzW5gz…](https://claude.ai/code/session_01PzW5gzJowdneEPuwrLp69Y) | claude/wall-finishes-448 | 51,1 Mio. | 245 Tsd. | gezählt |
| 2026-10-18 | [01EBbu2D…](https://claude.ai/code/session_01EBbu2DEhkhatLAduMRnY5U) | claude/stoic-sagan-rl75nd | 28,8 Mio. | 87 Tsd. | gezählt |
| 2026-10-18 | [01AYWz6w…](https://claude.ai/code/session_01AYWz6wYzsThMe2d8wbBU2F) | claude/ecstatic-mendel-q1v3yr | 4,1 Mio. | 46 Tsd. | gezählt |
| 2026-10-17 | [018qPqU6…](https://claude.ai/code/session_018qPqU6foiwRbhCmgn9QDNk) | HA-Floorplanner Aufgabe #425 | 146,5 Mio. | 246 Tsd. | Sitzungsliste |
| 2026-10-15 | [01NzeWUF…](https://claude.ai/code/session_01NzeWUFra9kp2ArSG2xxDmN) | 3D-Vorlagen im IKEA-Stil | 47,4 Mio. | 240 Tsd. | Sitzungsliste |
| 2026-10-15 | [01KaG1PZ…](https://claude.ai/code/session_01KaG1PZ8tWEijqWftdsLSG5) | Kamera-Stream-Anzeige | 40,7 Mio. | 164 Tsd. | Sitzungsliste |
| 2026-10-15 | [01LaRSJx…](https://claude.ai/code/session_01LaRSJxzKz8qaxcuXXQkAK3) | Floorplan Stromabrechnung Admin-Modus | 26,9 Mio. | 126 Tsd. | Sitzungsliste |
| 2026-10-14 | [01CnUujw…](https://claude.ai/code/session_01CnUujwN3sbboqRFvZCdYZm) | Heizung Temperaturanzeige Farben | 45,5 Mio. | 166 Tsd. | Sitzungsliste |
| 2026-10-14 | [01BFqDRm…](https://claude.ai/code/session_01BFqDRmriTudDBkgGdDCyZ4) | Heizungssteuerung mit externem Temperatursensor | 1,0 Mio. | 11 Tsd. | Sitzungsliste |
| 2026-10-13 | [01Sv2FJh…](https://claude.ai/code/session_01Sv2FJhPMcL9nyibJgGxMNK) | Küchenzeile ohne Oberschrank | 14,0 Mio. | 42 Tsd. | Sitzungsliste |
| 2026-10-13 | [01GTkWVi…](https://claude.ai/code/session_01GTkWVi2MgYXdi4hb2RxZsm) | TV-Auswahl ohne Entität | 44,6 Mio. | 129 Tsd. | Sitzungsliste |
| 2026-10-12 | [014mHMU6…](https://claude.ai/code/session_014mHMU6RQmDbKUdKST6UKEv) | Tür wird im Raum nicht angezeigt | 10,6 Mio. | 44 Tsd. | Sitzungsliste |
| 2026-10-12 | [018SKAM9…](https://claude.ai/code/session_018SKAM9PfJiwKX7rc5DT7X6) | AddIjn Überprüfung | 27,1 Mio. | 94 Tsd. | Sitzungsliste |
| 2026-10-11 | [013ybHa2…](https://claude.ai/code/session_013ybHa2kGG27pzFqdqWHQpv) | API-Beispielhaus mit JSON-Import | 67,9 Mio. | 170 Tsd. | Sitzungsliste |
| 2026-10-11 | [015jxZpU…](https://claude.ai/code/session_015jxZpUWFGo14oKZxKZYyNt) | Transparente Ansicht: nur Wände | 12,3 Mio. | 58 Tsd. | Sitzungsliste |
| 2026-10-11 | [01Fj5ci2…](https://claude.ai/code/session_01Fj5ci2nJQyjSPTRNLm13g6) | HACS Lovelace floor plan card | 40,8 Mio. | 153 Tsd. | Sitzungsliste |
| 2026-10-11 | [01BS1Jxg…](https://claude.ai/code/session_01BS1Jxgjs2cAXciRdmfc8bZ) | Dachform individuell anpassbar | 109,4 Mio. | 312 Tsd. | Sitzungsliste |
| 2026-10-10 | [01E4Fxjx…](https://claude.ai/code/session_01E4Fxjxm2eC1ZA7uBPz1FWw) | Stop live popup redrawing on every state update | 13,7 Mio. | 67 Tsd. | Sitzungsliste |
| 2026-10-10 | [017RmDgf…](https://claude.ai/code/session_017RmDgf3S8q36qxvfp9Ni6T) | Rollladen menu improvements | 25,6 Mio. | 89 Tsd. | Sitzungsliste |
| 2026-10-10 | [01MSnmZy…](https://claude.ai/code/session_01MSnmZy9zG72hnEj2u7Mebw) | Test-Suite Aufteilung | 79,3 Mio. | 118 Tsd. | Sitzungsliste |
| 2026-10-10 | [018u8ZyU…](https://claude.ai/code/session_018u8ZyUfUJeFXFCAn5Zwiu8) | Rollladensteuerung für Fenster | 101,2 Mio. | 209 Tsd. | Sitzungsliste |
| 2026-10-10 | [0114E5mG…](https://claude.ai/code/session_0114E5mGMRMzZPbro7z9zqHE) | Zigbee2mqtt Gerätumbenennung | 41,2 Mio. | 151 Tsd. | Sitzungsliste |
| 2026-10-10 | [012BmCWD…](https://claude.ai/code/session_012BmCWD138w3DGR2YJJ7g6r) | Pull request continuation | 13,3 Mio. | 35 Tsd. | Sitzungsliste |
| 2026-10-10 | [0132BsGq…](https://claude.ai/code/session_0132BsGqvKaKs1PrQXtB1nEn) | Entitäten-Update-Verzögerung | 8,4 Mio. | 31 Tsd. | Sitzungsliste |
| 2026-10-09 | [01PrxD3L…](https://claude.ai/code/session_01PrxD3LLwhtvvnDYp2QdQCq) | Test-Durchlauf fortgesetzt | 23,5 Mio. | 43 Tsd. | Sitzungsliste |
| 2026-10-09 | [014LTRJ2…](https://claude.ai/code/session_014LTRJ27CVSZ2W658z6fjDi) | Runden-Icons Überlagerung und Startansicht | 28,6 Mio. | 78 Tsd. | Sitzungsliste |
| 2026-10-08 | [014WKW7n…](https://claude.ai/code/session_014WKW7nfS4eKamXczHr1DCT) | 24-Stunden-Zeitreise für Hausautomation | 43,6 Mio. | 114 Tsd. | Sitzungsliste |
| 2026-10-08 | [017nnfwC…](https://claude.ai/code/session_017nnfwC3JnFdthWB71asyX8) | Hausansicht Anzeigefeld Problem | 9,8 Mio. | 24 Tsd. | Sitzungsliste |
| 2026-10-08 | [016ebtk6…](https://claude.ai/code/session_016ebtk6ka4D2jrgLhH5KTJN) | Tesläufe feedback | 1,0 Mio. | 4 Tsd. | Sitzungsliste |
| 2026-10-08 | [01FPVzmb…](https://claude.ai/code/session_01FPVzmbs14EGEYwbbiaVE26) | Handy-Ansicht Funktionalität | 7,4 Mio. | 22 Tsd. | Sitzungsliste |
| 2026-10-08 | [01MaCnPM…](https://claude.ai/code/session_01MaCnPMFiW3EbWBZvS7dCoi) | Mehrfachauswahl verschieben | 7,9 Mio. | 32 Tsd. | Sitzungsliste |
| 2026-10-08 | [016mwpib…](https://claude.ai/code/session_016mwpib5FVC7bYMfTqiepZA) | Benutzervoreinstellungen erweitern | 7,5 Mio. | 35 Tsd. | Sitzungsliste |
| 2026-10-08 | [01Nzv2rM…](https://claude.ai/code/session_01Nzv2rMmP1BbCvBYZGSg2Gv) | Handy-Ansicht Zoom-Problem | 6,7 Mio. | 15 Tsd. | Sitzungsliste |
| 2026-10-08 | [01Xg8be9…](https://claude.ai/code/session_01Xg8be9XxzsEsVGdzLL4vrH) | FPS und Performance-Werte anzeigen | 7,3 Mio. | 26 Tsd. | Sitzungsliste |
| 2026-10-08 | [014EMbuY…](https://claude.ai/code/session_014EMbuYdPVEfbtKKyVDzVc2) | Ahndy Ansicht UI-Layout | 26,7 Mio. | 53 Tsd. | Sitzungsliste |
| 2026-10-08 | [014yYvAf…](https://claude.ai/code/session_014yYvAf3Ra44Lcqau9vEgJH) | Meshifi-Datei im Projekt | 1,7 Mio. | 7 Tsd. | Sitzungsliste |
| 2026-10-07 | [01Mm1xou…](https://claude.ai/code/session_01Mm1xoupLkHf9212uEVyhpU) | Testverbindung | 79,7 Mio. | 132 Tsd. | Sitzungsliste |
| 2026-09-29 | estimate-other-accounts | 13 Sitzungen: Sitzungen von einem anderen Zugang, nur aus den Commits bekannt; geschätzt 2 Mrd. (eher 1 bis 4 Mrd.) | 2,00 Mrd. | 6,0 Mio. | geschätzt |
