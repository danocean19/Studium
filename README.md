# UI Kit Liquid Glass

Kit reutilizavel extraido do projeto atual, sem alterar a aplicacao principal.

## Arquivos

- `demo.html`: exemplo funcional da UI
- `ui-kit.css`: tokens, superficies, navegacao, topbar e responsividade
- `ui-kit.js`: troca de tema, troca de telas e alternancia mobile de Financas

## Como usar

1. Copie `ui-kit.css` e `ui-kit.js` para o outro projeto.
2. Replique a estrutura base de `demo.html`.
3. Troque os conteudos internos das secoes `.screen`.
4. Mantenha os atributos:
   - `data-screen`
   - `id="screen-..."`
   - `data-theme-choice`
   - `data-finance-screen`

## Comportamentos incluidos

- Tema claro/escuro com persistencia em `localStorage`
- Sidebar desktop
- Bottom navigation mobile
- Unificacao `Financas` no mobile para `Contas` e `Rendas`
- Topbar compacta no mobile

## Observacoes

- O kit usa apenas HTML, CSS e JS puro.
- Os icones atuais usam simbolos nativos para nao depender de bibliotecas externas.
- Para deixar igual ao projeto principal, use as mesmas fontes do Google Fonts.
