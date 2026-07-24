# Açaí Mart — SupermercadoFront

Exercício de front-end (SENAI) que simula a loja virtual de um supermercado, com catálogo de produtos, carrinho de compras, login de usuário e uma promoção-relâmpago dinâmica. Construído em **HTML, CSS e JavaScript puro (vanilla)**, sem frameworks ou bibliotecas externas.

## Funcionalidades

- **Catálogo de produtos** carregado dinamicamente a partir de um arquivo JSON (`db.json`), com preço atual, preço antigo, imagem e categoria.
- **Filtro por categoria** (Mercearia, Limpeza, Laticínios, Frutas, Hortifruti, etc.), gerado automaticamente a partir dos dados.
- **Busca em tempo real** por nome do produto.
- **Carrinho de compras** em painel lateral (drawer), com:
  - adicionar / remover itens;
  - incrementar / decrementar quantidade;
  - cálculo automático de subtotal e total;
  - finalização de compra (exige login).
- **Login de usuário** via modal, validado contra uma lista de usuários no próprio JSON.
- **Promoção-relâmpago automática**: das 15h às 17h, todos os produtos recebem R$ 1,00 de desconto, com banner e cronômetro regressivo até o fim da promoção, atualizados em tempo real.
- **Página extra "Sala B22"** (`b22.html`): um inventário separado de equipamentos/itens de sala de aula, com os mesmos recursos de filtro e busca do catálogo principal.
- **Notificações "toast"** para feedback de ações (produto adicionado, login inválido, etc.).

## Tecnologias

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)** — Classes, `fetch`, `async/await`, manipulação de DOM
- **JSON** como fonte de dados (sem backend/servidor)

Não há dependências, build step ou instalação de pacotes: é um projeto 100% estático.

## Estrutura do projeto

```
Supermercado/
├── html/
│   ├── index.html          # Página principal da loja
│   ├── b22.html             # Página do inventário da Sala B22
│   ├── imagens/              # Imagens dos produtos, logo e ícones
│   └── JSON/
│       └── db.json           # Dados: produtos, usuários e itens da Sala B22
├── css/
│   └── style.css             # Estilos de toda a aplicação
└── js/
    └── script.js              # Lógica da loja: catálogo, carrinho, login, promoção
```

## Como executar

Por ser um projeto estático (HTML/CSS/JS), basta abrir o `index.html` no navegador. Como o app carrega dados via `fetch("JSON/db.json")`, alguns navegadores bloqueiam essa leitura quando o arquivo é aberto direto do disco (`file://`) — por isso o recomendado é servir os arquivos com um servidor local:

**Opção 1 — VS Code Live Server**
1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito em `Supermercado/html/index.html`.
3. Selecione **"Open with Live Server"**.

**Opção 2 — servidor HTTP simples (Python)**
```bash
cd Supermercado/html
python3 -m http.server 5500
```
Depois acesse `http://localhost:5500` no navegador.

**Opção 3 — servidor HTTP simples (Node.js)**
```bash
cd Supermercado/html
npx serve
```

## Usuários de teste

Para testar o login e a finalização de compra, use um dos usuários cadastrados em `db.json`:

| Nome     | E-mail            | Senha |
|----------|--------------------|-------|
| pedro    | pedro@gmail        | 1234  |
| alves    | alves@gmail        | 5678  |
| vinicius | vinicius@gmail     | 6967  |

## Páginas

- **`index.html`** — loja principal: catálogo, busca, filtros, carrinho e login.
- **`b22.html`** — inventário da Sala B22, com filtros por categoria e busca, acessível pelo botão "Sala B22" no cabeçalho da loja.

## Observações

- Todo o estado (carrinho, login, promoção) vive em memória no navegador; ao recarregar a página, o carrinho é reiniciado.
- Não há persistência em banco de dados nem back-end: o `db.json` funciona como uma "API estática" local.
- A promoção-relâmpago depende do horário do sistema do navegador (15h–17h).

## Autor

Projeto desenvolvido por [vinicius-31008](https://github.com/vinicius-31008) como exercício da disciplina de Front-End do SENAI.

## Licença

Projeto acadêmico, sem licença específica definida.
