# grid-pic

Proste narzędzie w przeglądarce (zoptymalizowane pod telefon): wczytaj zdjęcie lub grafikę, nałóż siatkę i zapisz wynik.

## Funkcje
- dowolna liczba kolumn i rzędów (1–40)
- kolor siatki (6 kontrastowych kolorów) i grubość linii
- opcjonalne oznaczenia kratek w narożnikach (A1, B1, … — litera = kolumna, cyfra = rząd)
- skala szarości oraz suwaki kontrastu, jasności i nasycenia obrazu pod siatką
- format papieru (A8–A3, własny wymiar w mm): siatka ma proporcje papieru, jest możliwie największa w obrębie obrazu i da się ją ustawić na środku, w prawym górnym lub lewym dolnym rogu
- podgląd wymiaru jednej kratki w mm na obrazie
- przeciąganie siatki palcem lub myszą; przybliżanie podglądu szczypaniem dwoma palcami (które też przesuwa widok), kółkiem myszy lub przyciskami +/−; na komputerze powiększony widok przesuwa się prawym przyciskiem myszy albo z klawiszem Shift (powiększenie nie wpływa na zapisany plik)
- wczytywanie przez wybór pliku lub przeciągnięcie na okno
- zapis do PNG w pełnej rozdzielczości (na telefonie przez arkusz udostępniania → „Zapisz obraz”)

Wszystko działa lokalnie w przeglądarce, bez wysyłania zdjęć na serwer i bez zależności.

## Uruchomienie
Otwórz `index.html` albo `python3 -m http.server` w katalogu projektu.
