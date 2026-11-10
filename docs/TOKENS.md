# Token-Verbrauch von Claude

<!-- Wird von tools/tokens.py erzeugt (Workflow „Token count“ nach jedem Merge). Nicht von Hand ändern. -->

Stand: 2026-11-10 · 127 Sitzungen

**Insgesamt: 8,48 Mrd. Tokens** (davon 2,00 Mrd. geschätzt)

| | Tokens | Was ist das? |
|---|---:|---|
| Geschrieben | 23,5 Mio. | Text, Code und Nachdenken, das Claude neu geschrieben hat |
| Neu gelesen | 80,9 Mio. | Nachrichten, Dateien und Ausgaben, die zum ersten Mal ins Gespräch kamen |
| Wieder gelesen | 8,37 Mrd. | das bisherige Gespräch, das Claude bei jedem Schritt noch einmal liest (die meisten Tokens, aber billig) |

Jede Sitzung schreibt ihre Zahlen bei jedem `git commit` in `docs/tokens/` (egal mit welchem Zugang). Was nach dem letzten Commit einer Sitzung noch verbraucht wird, fehlt; die Zahl ist also eher zu klein.

## Pro Monat

| Monat | Sitzungen | Tokens | davon geschrieben |
|---|---:|---:|---:|
| 2026-11 | 41 | 2,35 Mrd. | 5,7 Mio. |
| 2026-10 | 73 | 4,13 Mrd. | 11,7 Mio. |
| geschätzt | 13 | 2,00 Mrd. | 6,0 Mio. |

## Pro Sitzung (neueste zuerst)

| Beginn | Sitzung | Worum es ging | Tokens | davon geschrieben | Quelle |
|---|---|---|---:|---:|---|
| 2026-11-10 | [018pwcmy…](https://claude.ai/code/session_018pwcmyz3i2xa5YFSbPMLaA) | claude/sweet-carson-yxl5i4 | 28,7 Mio. | 65 Tsd. | gezählt |
| 2026-11-10 | [018pwcmy…](https://claude.ai/code/session_018pwcmy68YKhEKzJ8dNTuwJ) | claude/lucid-cray-gfs610 | 92,5 Mio. | 193 Tsd. | gezählt |
| 2026-11-09 | [012p9z3P…](https://claude.ai/code/session_012p9z3PULpwxe5ThzvSP6K8) | claude/clever-planck-9y4ptt | 176,8 Mio. | 275 Tsd. | gezählt |
| 2026-11-09 | [012p9z3M…](https://claude.ai/code/session_012p9z3MJ3efYp3wSxzmqFs3) | claude/sleepy-cray-df5ney | 12,3 Mio. | 43 Tsd. | gezählt |
| 2026-11-09 | [012p9z3L…](https://claude.ai/code/session_012p9z3L2RX8p1QmxycAdJzo) | claude/focused-mendel-llr2jj | 20,1 Mio. | 70 Tsd. | gezählt |
| 2026-11-09 | [012p9z3M…](https://claude.ai/code/session_012p9z3MuFE7E7x5NDszDBha) | claude/room-lock-display-issue-6jzqw1 | 31,2 Mio. | 77 Tsd. | gezählt |
| 2026-11-09 | [012p9z3N…](https://claude.ai/code/session_012p9z3N23ztn6k7SJJgy5M6) | claude/gallant-mayer-babeuw | 19,9 Mio. | 86 Tsd. | gezählt |
| 2026-11-09 | [012p9z3P…](https://claude.ai/code/session_012p9z3P3GhVTZPghFyi7JZk) | claude/awesome-cori-o6d0or | 34,6 Mio. | 147 Tsd. | gezählt |
| 2026-11-09 | [012p9z3P…](https://claude.ai/code/session_012p9z3P96Bpfq9bHrmpoyjC) | claude/upbeat-bohr-shj54u | 121,5 Mio. | 344 Tsd. | gezählt |
| 2026-11-08 | [012p9z3L…](https://claude.ai/code/session_012p9z3L75ZVQqL276tL5GAg) | claude/sleepy-turing-w83zy6 | 148,1 Mio. | 341 Tsd. | gezählt |
| 2026-11-08 | [012p9z3P…](https://claude.ai/code/session_012p9z3PUZEEdXDtE3w1duaa) | claude/cool-babbage-rpr5uz | 45,1 Mio. | 98 Tsd. | gezählt |
| 2026-11-08 | [012p9z3M…](https://claude.ai/code/session_012p9z3MTTgg1hsKmerNxB2F) | claude/fervent-mendel-ce11vm | 103,5 Mio. | 215 Tsd. | gezählt |
| 2026-11-08 | [012p9z3M…](https://claude.ai/code/session_012p9z3MvfYahz7cAueA6Q5H) | claude/elegant-faraday-858q3v | 29,6 Mio. | 100 Tsd. | gezählt |
| 2026-11-07 | [018pwcmx…](https://claude.ai/code/session_018pwcmxutQDa2cztZ7QgFhw) | claude/festive-brahmagupta-1i6xm4 | 67,4 Mio. | 190 Tsd. | gezählt |
| 2026-11-06 | [018pwcmx…](https://claude.ai/code/session_018pwcmxad2DogQ9PVxk2G2X) | claude/nifty-clarke-1sw4k9 | 49,2 Mio. | 143 Tsd. | gezählt |
| 2026-11-06 | [018pwcmv…](https://claude.ai/code/session_018pwcmvqAqTjbedoqaU8Qvm) | claude/tests-selbst-pruefen | 79,1 Mio. | 176 Tsd. | gezählt |
| 2026-11-05 | [018pwcmw…](https://claude.ai/code/session_018pwcmwYymXU78zE1PZdFb8) | claude/mehr-als-grundriss | 22,0 Mio. | 85 Tsd. | gezählt |
| 2026-11-05 | [018pwcmv…](https://claude.ai/code/session_018pwcmvjprR3UcyqXcCrAM9) | claude/tiktok-clips | 27,5 Mio. | 128 Tsd. | gezählt |
| 2026-11-05 | [018pwcmz…](https://claude.ai/code/session_018pwcmzDCUiow9hhUSgz21G) | claude/sleepy-bohr-hti0hs | 22,5 Mio. | 50 Tsd. | gezählt |
| 2026-11-03 | [018pwcmz…](https://claude.ai/code/session_018pwcmzaSQw5fCUGZR5wDZA) | claude/dreamy-knuth-6p1s4h | 471,0 Mio. | 666 Tsd. | gezählt |
| 2026-11-03 | [018pwcmx…](https://claude.ai/code/session_018pwcmxVVTnezr3eQr4cvDx) | claude/kippwinkel | 53,7 Mio. | 143 Tsd. | gezählt |
| 2026-11-03 | [018pwcmx…](https://claude.ai/code/session_018pwcmxGmEcMG4NqTUCKepS) | claude/repo-beschreibung | 809 Tsd. | 6 Tsd. | gezählt |
| 2026-11-03 | [018pwcmv…](https://claude.ai/code/session_018pwcmvaeTwnswbN4bTaHMg) | claude/stoic-davinci-zy4wnz | 37,3 Mio. | 97 Tsd. | gezählt |
| 2026-11-03 | [018pwcmv…](https://claude.ai/code/session_018pwcmvwnSiNfkpVvVDjQDT) | claude/inspiring-davinci-m53387 | 31,6 Mio. | 111 Tsd. | gezählt |
| 2026-11-03 | [018pwcmw…](https://claude.ai/code/session_018pwcmwrRFv9UuMWqRUy2gA) | claude/determined-hypatia-sa2b2n | 4,1 Mio. | 33 Tsd. | gezählt |
| 2026-11-03 | [012p9z3P…](https://claude.ai/code/session_012p9z3P9DdqJbm5cNXuF1sT) | claude/cool-cerf-lkll8w | 59,9 Mio. | 159 Tsd. | gezählt |
| 2026-11-03 | [012p9z3L…](https://claude.ai/code/session_012p9z3LxbrqiTg4TzkYTboN) | claude/adoring-davinci-ml5253 | 4,3 Mio. | 32 Tsd. | gezählt |
| 2026-11-03 | [012p9z3L…](https://claude.ai/code/session_012p9z3L8go8MUhKbRZwa3tK) | claude/magical-babbage-yqlota | 2,6 Mio. | 24 Tsd. | gezählt |
| 2026-11-03 | [012p9z3M…](https://claude.ai/code/session_012p9z3MNdj67CXLjPuxCcwf) | claude/affectionate-ramanujan-zuoyk1 | 14,7 Mio. | 111 Tsd. | gezählt |
| 2026-11-03 | [012p9z3L…](https://claude.ai/code/session_012p9z3LxG2D9unSS3STHLrM) | claude/l-shape-roof-requests-rdsr3n | 21,3 Mio. | 79 Tsd. | gezählt |
| 2026-11-02 | [012p9z3K…](https://claude.ai/code/session_012p9z3KTuffmiV9y4d2t3zQ) | claude/treppe-gewendelt | 57,5 Mio. | 138 Tsd. | gezählt |
| 2026-11-02 | [018pwcmy…](https://claude.ai/code/session_018pwcmyzUzu2pz8MrkhyZiS) | claude/busy-mendel-19uyc6 | 6,1 Mio. | 22 Tsd. | gezählt |
| 2026-11-02 | [018pwcmz…](https://claude.ai/code/session_018pwcmzDhExLRrCtejBrUkM) | claude/laughing-johnson-ywzr01 | 57,2 Mio. | 211 Tsd. | gezählt |
| 2026-11-02 | [012p9z3N…](https://claude.ai/code/session_012p9z3NNfVZMCshSxFvk3am) | claude/friendly-volta-zr81od | 12,8 Mio. | 38 Tsd. | gezählt |
| 2026-11-02 | [012p9z3P…](https://claude.ai/code/session_012p9z3PGPEY664oMRVqvxeC) | claude/vibrant-rubin-u6bl4t | 995 Tsd. | 12 Tsd. | gezählt |
| 2026-11-02 | [012p9z3L…](https://claude.ai/code/session_012p9z3LHsTF7PVeeqgiY9eQ) | claude/focused-bohr-hqiye4 | 25,0 Mio. | 86 Tsd. | gezählt |
| 2026-11-02 | [012p9z3K…](https://claude.ai/code/session_012p9z3KHPevDmhRg73m49xE) | claude/github-issue-628-p6mfc1 | 61,5 Mio. | 189 Tsd. | gezählt |
| 2026-11-02 | [012p9z3N…](https://claude.ai/code/session_012p9z3NqajFvYzgPkCU1W4T) | claude/ecstatic-fermat-2nup12 | 65,9 Mio. | 165 Tsd. | gezählt |
| 2026-11-02 | [012p9z3L…](https://claude.ai/code/session_012p9z3LEvbZDmg5wK6wBzns) | claude/backup-komplett | 35,8 Mio. | 108 Tsd. | gezählt |
| 2026-11-02 | [012p9z3N…](https://claude.ai/code/session_012p9z3NHQDzcAbYuPScYobG) | claude/keen-babbage-0ovkmx | 142,7 Mio. | 314 Tsd. | gezählt |
| 2026-11-01 | [012p9z3M…](https://claude.ai/code/session_012p9z3M7Hjd5FgQH9PAcgZ7) | claude/besondere-tage | 50,9 Mio. | 143 Tsd. | gezählt |
| 2026-10-31 | [012p9z3P…](https://claude.ai/code/session_012p9z3PwGpSQUTnQwfP7meT) | claude/fenster-vorhaenge | 30,0 Mio. | 96 Tsd. | gezählt |
| 2026-10-30 | [018pwcmx…](https://claude.ai/code/session_018pwcmxZAxkAymAbButeKpY) | claude/affectionate-cray-4wiii6 | 7,3 Mio. | 42 Tsd. | gezählt |
| 2026-10-30 | [018pwcmw…](https://claude.ai/code/session_018pwcmwU8ZobHhKBxttE6Wc) | claude/exciting-ride-totxku | 41,4 Mio. | 164 Tsd. | gezählt |
| 2026-10-29 | [012p9z3M…](https://claude.ai/code/session_012p9z3MJ39jRYCv55o46a3L) | claude/dashboard-scenes-light-control-pqpgty | 78,8 Mio. | 203 Tsd. | gezählt |
| 2026-10-29 | [018pwcmx…](https://claude.ai/code/session_018pwcmxVwk2kDDTuDz7KaLU) | claude/ausgeblendet-liste | 14,4 Mio. | 58 Tsd. | gezählt |
| 2026-10-29 | [018pwcmx…](https://claude.ai/code/session_018pwcmxfdeofPfhGXgwoJZH) | claude/test-132-3 | 6,1 Mio. | 55 Tsd. | gezählt |
| 2026-10-29 | [018pwcmx…](https://claude.ai/code/session_018pwcmxaS7azgUF14TYCs1J) | claude/raumfuehler-wunsch | 27,3 Mio. | 127 Tsd. | gezählt |
| 2026-10-29 | [018pwcmy…](https://claude.ai/code/session_018pwcmycA5eEFzYTvBa4D12) | claude/vibrant-planck-5xczbv | 86,2 Mio. | 227 Tsd. | gezählt |
| 2026-10-28 | [018pwcmw…](https://claude.ai/code/session_018pwcmwDVGARHBTGbLFTYfd) | claude/zu-warm | 161,1 Mio. | 458 Tsd. | gezählt |
| 2026-10-28 | [018pwcmy…](https://claude.ai/code/session_018pwcmyrfwzDmvZ9srfrVEn) | claude/raumfuehler-fenster | 19,7 Mio. | 101 Tsd. | gezählt |
| 2026-10-28 | [018pwcmv…](https://claude.ai/code/session_018pwcmvXw11BqT9e5qmkBLs) | claude/eager-dijkstra-xazuo3 | 134,6 Mio. | 283 Tsd. | gezählt |
| 2026-10-28 | [018pwcmy…](https://claude.ai/code/session_018pwcmyCw5SigrgcGVDbhna) | claude/fenster-regel-raumtemp | 23,2 Mio. | 80 Tsd. | gezählt |
| 2026-10-27 | [012p9z3M…](https://claude.ai/code/session_012p9z3MehrvCSghkQBMFXrA) | claude/loving-cray-ym4z59 | 70,7 Mio. | 220 Tsd. | gezählt |
| 2026-10-27 | [018pwcmv…](https://claude.ai/code/session_018pwcmvwtPozKLhotJq1rE4) | claude/friendly-cerf-ydliez | 35,8 Mio. | 138 Tsd. | gezählt |
| 2026-10-27 | [012p9z3M…](https://claude.ai/code/session_012p9z3MaHwyjf7hJG4tdSBQ) | claude/great-curie-521hrr | 67,2 Mio. | 237 Tsd. | gezählt |
| 2026-10-26 | [01Kb43R9…](https://claude.ai/code/session_01Kb43R9XdRKwsU4xXkgGbH1) | claude/relaxed-dirac-33z1ry | 42,9 Mio. | 152 Tsd. | gezählt |
| 2026-10-26 | [016jmtCr…](https://claude.ai/code/session_016jmtCrzuXWmNUwQWWyP6N3) | claude/zug-karte | 203,0 Mio. | 677 Tsd. | gezählt |
| 2026-10-26 | [01DqQrUx…](https://claude.ai/code/session_01DqQrUx4E1LRBHxiTsdCYuZ) | claude/dazzling-mayer-qoapl9 | 57,6 Mio. | 214 Tsd. | gezählt |
| 2026-10-26 | [01GiYJyk…](https://claude.ai/code/session_01GiYJykTb4kkK6SJZ99EtwZ) | claude/friendly-goldberg-30ll7l | 96,3 Mio. | 392 Tsd. | gezählt |
| 2026-10-25 | [01Xcva7G…](https://claude.ai/code/session_01Xcva7GeERrW4aDeZeeiqRP) | claude/test-results-4-26 | 290,1 Mio. | 574 Tsd. | gezählt |
| 2026-10-25 | [01VHc3XY…](https://claude.ai/code/session_01VHc3XYCH7teSWnQGdotmca) | claude/overnight-tests | 150,6 Mio. | 291 Tsd. | gezählt |
| 2026-10-23 | [013KYpwZ…](https://claude.ai/code/session_013KYpwZAdTHCC2NNXJH35Qg) | claude/battery-levels | 25,9 Mio. | 100 Tsd. | gezählt |
| 2026-10-23 | [016JoEDf…](https://claude.ai/code/session_016JoEDfoC6zogAcn3MiDM4z) | claude/festive-wozniak-kyfflg | 11,5 Mio. | 58 Tsd. | gezählt |
| 2026-10-23 | [01JzYNo6…](https://claude.ai/code/session_01JzYNo6b3ZemrfnFrKdBWC3) | claude/inspiring-newton-2s5ca2 | 14,9 Mio. | 127 Tsd. | gezählt |
| 2026-10-23 | [01CHf76M…](https://claude.ai/code/session_01CHf76Mzq478pT6HgcTDz6D) | claude/voice-search | 64,4 Mio. | 221 Tsd. | gezählt |
| 2026-10-23 | [013q8n1E…](https://claude.ai/code/session_013q8n1Er5ZTqQ9hA1nN39DJ) | claude/laughing-ptolemy-iqgsx6 | 30,2 Mio. | 141 Tsd. | gezählt |
| 2026-10-22 | [01CbgqAo…](https://claude.ai/code/session_01CbgqAoU7ADnHKnxsGbzmjt) | claude/sweet-edison-4obkyg | 345,1 Mio. | 705 Tsd. | gezählt |
| 2026-10-21 | [014T6pwt…](https://claude.ai/code/session_014T6pwtdfaLFq9HcZLAKcyK) | claude/paket-2-weiterbau-odqi1b | 254,1 Mio. | 658 Tsd. | gezählt |
| 2026-10-21 | [01DDzzeJ…](https://claude.ai/code/session_01DDzzeJPv4Z2UFXQyvnyWfn) | claude/nice-shannon-mee5c5 | 145,5 Mio. | 371 Tsd. | gezählt |
| 2026-10-21 | [01XZ7uoX…](https://claude.ai/code/session_01XZ7uoXczHK9f1bjnb15XQy) | claude/vibrant-knuth-ne1uru | 57,1 Mio. | 129 Tsd. | gezählt |
| 2026-10-21 | [014r9ofm…](https://claude.ai/code/session_014r9ofmkBtcwFDi1TP7xawo) | claude/intelligent-cannon-tlhqho | 50,1 Mio. | 161 Tsd. | gezählt |
| 2026-10-20 | [01FLJgnc…](https://claude.ai/code/session_01FLJgnccXH4FvQBPYKrEetV) | claude/jolly-mccarthy-h45dtm | 29,7 Mio. | 83 Tsd. | gezählt |
| 2026-10-20 | [011WS5Bj…](https://claude.ai/code/session_011WS5BjtRCU9x39YdeFjhzB) | claude/stoic-cray-rb7ve0 | 27,0 Mio. | 79 Tsd. | gezählt |
| 2026-10-19 | [019EgSUA…](https://claude.ai/code/session_019EgSUAufDd5QPqMWfzc3QR) | claude/epic-planck-l833hc | 18,7 Mio. | 65 Tsd. | gezählt |
| 2026-10-18 | [01UoZhsk…](https://claude.ai/code/session_01UoZhskVzkQSQ3wfn9kvzoS) | claude/ecstatic-curie-689tep | 137,8 Mio. | 369 Tsd. | gezählt |
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
