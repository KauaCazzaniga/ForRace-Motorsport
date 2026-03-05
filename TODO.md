# TODO

## Performance: reduzir peso das imagens

- [ ] Comprimir imagens grandes (ex: `img/gol-rally.png`, `img/escort-rs.png`, `img/fusca-copa.png`, `img/track-0*.png`).
- [ ] Gerar vers?es otimizadas (WebP/AVIF) e servir via `picture`.
- [ ] Definir tamanho alvo por breakpoint (desktop/mobile) para evitar downloads excessivos.
- [ ] Considerar lazy-loading para imagens fora da dobra.
- [ ] Reexecutar build e validar warnings de asset size no webpack.
