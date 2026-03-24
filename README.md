# Studium PWA

Aplicação web em HTML, CSS e JavaScript puro, agora preparada para funcionar como app instalável.

## O que foi adicionado

- `manifest.webmanifest`: metadados do app instalável
- `service-worker.js`: cache da shell da aplicação para uso offline
- `icons/icon.svg`: ícone do app
- Botão `Instalar app` na topbar quando o navegador permitir a instalação

## Como executar

PWA não funciona corretamente abrindo o `index.html` direto por `file://`. Rode com um servidor local simples.

Se tiver Python:

```bash
py -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Como instalar

- No Chrome ou Edge desktop, abra o app e clique em `Instalar app`.
- No Android, abra no navegador compatível e use a opção de instalar na tela inicial.
- No iPhone/iPad, use `Compartilhar` > `Adicionar à Tela de Início`.

## Observações

- Os dados continuam salvos localmente via `localStorage`.
- O modo offline cobre os arquivos principais da interface.
- Fontes remotas do Google podem depender de conexão na primeira carga.
