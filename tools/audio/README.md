# Biblioteca de gravações

O motor usa exclusivamente os arquivos locais de `public/audio`. Música procedural e sintetizador de efeitos não são usados na reprodução. A página `audio/index.html`, acessível pelas configurações, permite ouvir e consultar os créditos de cada arquivo.

São seis faixas completas: Unexplored Expansion e Fantasy Choir 1 para exploração; Cave Theme para masmorras profundas; Hope e Fantasy Choir 3 para combate; Fantasy Choir 2 e 3 para chefes. A seleção varia por fase e variante. As músicas entram com crossfade de 1,5 s e conservam seu timbre original. Pausa e aba oculta suspendem o relógio de áudio. São mantidos no cache no máximo dois buffers musicais decodificados.

Os efeitos incluem variações de gravação, ataques físicos, lançamentos e impactos separados, oito elementos e os quatro ambientes. O banco decodifica cada arquivo uma vez e compartilha requisições concorrentes. Efeitos ainda não carregados são descartados em vez de tocar atrasados. O limite de vozes usa a duração real da gravação e sua velocidade de reprodução.

## Origem e reprodução da importação

O manifesto registra os nomes originais, páginas dos autores, licenças e SHA-256 de originais e convertidos. `CREDITOS.md` documenta as adaptações. O arco de dorkster mantém CC-BY-SA 3.0; cura, fogo e goteira usam CC-BY 3.0; vento usa CC-BY 4.0; os demais são CC0.

O importador recebe um diretório de fontes extraídas e o executável do FFmpeg com libmp3lame:

```
python tools/audio/importar.py CAMINHO_FONTES CAMINHO_FFMPEG
```

As fontes e nomes dentro dos arquivos estão em `SOURCES`, `series` e `ORIGINAIS`. As páginas ali indicadas oferecem os downloads oficiais; a Kenney usa links temporários obtidos pelo botão de download. Os pacotes completos ficam fora do repositório. Arquivos foram convertidos para MP3 (compatível com navegador e Android), 32 kHz, efeitos mono a 80 kbps e músicas estéreo a 128 kbps. Efeitos são normalizados para pico de -5 dBFS; músicas para -21 LUFS, com entrada de 0,3 s e saída de 0,8 s.

## Offline

Todos os MP3, ambientes, manifesto e créditos entram no precache PWA. Após concluir a instalação do cache, a biblioteca inteira funciona offline. O download de áudio soma cerca de 11,6 MiB. No Android, os arquivos são incluídos no APK. Uma falha de download mantém a música anterior e nunca impede jogar.

## Conjuração e armas secundárias

Ataques básicos de arma (`basico_*`), inclusive o tomo na mão secundária do Guerreiro, não disparam preparação genérica. O antigo `charge.wav` de 4,13 segundos foi retirado da distribuição. Conjurações longas usam as gravações curtas de magia da rubberduck, com até 220 ms e intervalo mínimo de 500 ms; lançamentos genéricos usam até 180 ms. Esses efeitos e o impacto genérico mágico têm uma voz por tipo e saída suave, usando o relógio do áudio para preservar os limites durante pausas.

## Zunido e invocação (06/11/2026)

O ataque básico mágico toca um zunido curto (Swishes Sound Pack, artisticdude, CC0) no lançamento e no impacto; o
básico físico segue o som da arma e as habilidades, o do elemento. O surgimento da invocação é uma risada baixa
(Evil Laugh 2, AntumDeluge, CC0) com o tom descido, uma por vez e no máximo uma a cada 1,5 s. Sem FFmpeg na
máquina, estes quatro arquivos são WAV feitos no Chromium por `node tools/audio/adaptar.mjs CAMINHO_FONTES`
(velocidade, recorte, pico de -5 dBFS, mono de 32 kHz); `importar.py` preserva as entradas com `adaptacao`.
