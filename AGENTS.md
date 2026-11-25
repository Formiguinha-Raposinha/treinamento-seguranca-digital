# Regras do Projeto — Sempre Sincronizar com a Nuvem

- A pasta principal de desenvolvimento deste projeto é `F:\Projeto Extensao I`.
- A pasta espelho em nuvem (OneDrive) é `C:\Users\vitoriasantos\OneDrive\Projetos\Projeto Extensao I` (e, quando disponível fora do sandbox em outro computador, também o Google Drive `G:\`).
- **REGRA OBRIGATÓRIA:** Sempre que criar, editar ou remover qualquer arquivo do projeto em `F:\Projeto Extensao I` (ou gerar um novo `dist/` com `npm run build`), **execute `npm run backup`** (que roda `scripts/sync_folders.ps1 -Direction ToCloud`) ao final das alterações para manter a pasta na nuvem 100% sincronizada e sem `node_modules`.
- Nunca faça alterações apenas na cópia do OneDrive sem sincronizar de volta ou manter ambas alinhadas.
- Se precisar rodar apenas o servidor Vite sem o monitor automático de backup, use `npm run dev:only`; o comando padrão `npm run dev` (também usado pelo `F5` no VS Code) já sincroniza na inicialização e em tempo real.
