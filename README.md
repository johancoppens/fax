# Faxlijn 9600: hoe werkt een fax?

Een interactieve simulatie van een Group 3-fax (de soort die vanaf 1980 overal stond), voor de klas. Je hoort het echte geluid van een fax en ziet live hoe de ontvanger de piepjes terug omzet: geluid → enen en nullen → betekenis → puntjes op papier.

De fax werd uitgevonden in 1843 door Alexander Bain, 33 jaar vóór de telefoon, en was al in 1865 in gebruik tussen Parijs en Lyon.

## Gebruik

Open `faxlijn.html` in een browser. Eén bestand, geen installatie, geen server. Alleen de lettertypes komen van Google Fonts; zonder internet worden standaardlettertypes gebruikt.

- **Bel en verstuur** speelt het hele gesprek af (ongeveer 30 s): bellen, afspreken, testen, beeld, ophangen.
- Eigen inhoud: typ een bericht, sleep een afbeelding in het venster, plak een screenshot (Ctrl+V) of neem een foto met de webcam.
- Uitleg zit achter de **?**-knopjes en in het venster **Uitleg**; **Techniek** toont spectrogram, constellatie en protocol.

De webcam werkt wanneer de pagina rechtstreeks of via https geopend wordt. In een afgeschermd kader (zoals een claude.ai-artifact) valt de knop terug op de camera-invoer van de browser (gsm, tablet) of een bestandskiezer.

## Wat er echt gebeurt

Het geluid wordt berekend volgens de ITU-normen en de ontvanger decodeert het opnieuw uit het geluid:

- **T.30** handdruk: CNG 1100 Hz, CED 2100 Hz, HDLC-frames (CSI, DIS, TSI, DCS, CFR, EOP, MCF, DCN) met CRC
- **V.21** FSK op 300 bit/s (1650 Hz = 1, 1850 Hz = 0)
- **V.29** QAM op 9600 bit/s: 2400 baud, draaggolf 1700 Hz, 16 punten, scrambler 1 + x⁻¹⁸ + x⁻²³, trainingsreeks
- **T.4** Modified Huffman: run-lengtes, EOL, RTC; 1728 punten per regel, 3,85 regels per mm

Vereenvoudigd: de ontvanger kent de symboolklok en de draaggolffase al (de training dient alleen voor de versterking), de pauze na CNG is korter, er is geen NSF-frame, en de bits in DIS en DCS zijn niet exact volgens de norm. Het geluid wordt gemaakt op 24 kHz met wat lijnruis.

## Opbouw van `faxlijn.html`

- `<style>`: opmaak, kleuren als tokens bovenaan.
- `<script id="core">`: de kern zonder DOM: codetabellen, HDLC, V.21, V.29, synthese (`buildCall`) en de decoder (`Monitor`).
- het tweede `<script>`: de pagina, tekenen, geluid afspelen, upload, webcam, tooltips.

## Test

```sh
node test/roundtrip.js
```

Maakt een volledig gesprek met een testblad, decodeert het uit het geluid en controleert dat alle frames een correcte CRC hebben, de TCF-test zonder fouten is en alle 481 regels bit-exact terugkomen. De test leest de kern rechtstreeks uit `faxlijn.html`.
