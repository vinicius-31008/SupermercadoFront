/* ============================================================
   Açaí Mart — loja principal
   Catálogo, filtros, busca, carrinho, login e promoção relâmpago
   ============================================================ */

/* ---------- Promoção relâmpago ---------- */

const PROMOCAO = {
  desconto: 1.0, // R$ de desconto por produto
  inicio: 15,    // 15h
  fim: 17,       // 17h (exclusivo)
};

// Para testar fora do horário, abra a página com ?promo=on
const PROMO_FORCADA = new URLSearchParams(location.search).get("promo") === "on";
const PROMO_FORCADA_FIM = Date.now() + 2 * 60 * 60 * 1000;

/** Retorna se a promoção está ativa e quantos segundos faltam para acabar. */
function estadoPromocao(agora = new Date()) {
  if (PROMO_FORCADA) {
    const resta = Math.max(0, Math.ceil((PROMO_FORCADA_FIM - agora) / 1000));
    return { ativa: resta > 0, restaSeg: resta };
  }
  const hora = agora.getHours();
  const ativa = hora >= PROMOCAO.inicio && hora < PROMOCAO.fim;
  if (!ativa) return { ativa: false, restaSeg: 0 };

  const fim = new Date(agora);
  fim.setHours(PROMOCAO.fim, 0, 0, 0);
  return { ativa: true, restaSeg: Math.ceil((fim - agora) / 1000) };
}

function formatarTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

/* ---------- Modelos ---------- */

class Produto {
  /** Compartilhado por todos os produtos: a promoção vale para o catálogo inteiro. */
  static promocaoAtiva = false;

  constructor({ id, nome, preco, precoAntigo, imagem, categoria }) {
    this.id = id;
    this.nome = nome;
    this.precoBase = preco;
    this.precoAntigo = precoAntigo;
    this.imagem = imagem;
    this.categoria = categoria;
  }

  /** Preço atual, já com o desconto relâmpago quando ativo. */
  get preco() {
    return Produto.promocaoAtiva
      ? Math.max(0, this.precoBase - PROMOCAO.desconto)
      : this.precoBase;
  }

  get percentualDesconto() {
    if (!this.precoAntigo || this.precoAntigo <= this.preco) return 0;
    return Math.round((1 - this.preco / this.precoAntigo) * 100);
  }

  renderCard(quantidadeNoCarrinho) {
    const promo = Produto.promocaoAtiva;
    const nome = escapeHTML(this.nome);

    return `
      <article class="produto${promo ? " em-promocao" : ""}" data-id="${this.id}">
        <div class="produto-imagem">
          ${this.percentualDesconto ? `<span class="selo-desconto">-${this.percentualDesconto}%</span>` : ""}
          ${promo ? `<span class="selo-relampago"><svg class="icone"><use href="#i-raio"/></svg>R$ 1 OFF</span>` : ""}
          <img src="imagens/${encodeURI(this.imagem)}" alt="${nome}" loading="lazy" />
        </div>
        <div class="produto-corpo">
          <span class="produto-categoria">${escapeHTML(this.categoria)}</span>
          <h3>${nome}</h3>
          <div class="produto-precos">
            <span class="preco-antigo">${formatarMoeda(this.precoAntigo)}</span>
            ${promo ? `<span class="preco-antigo">${formatarMoeda(this.precoBase)}</span>` : ""}
            <span class="preco">${formatarMoeda(this.preco)}</span>
          </div>
          <div class="produto-acao">${Produto.renderAcao(this.id, quantidadeNoCarrinho)}</div>
        </div>
      </article>`;
  }

  /** Botão "Adicionar" ou seletor de quantidade, se já estiver no carrinho. */
  static renderAcao(id, quantidade) {
    if (!quantidade) {
      return `
        <button type="button" class="btn-adicionar" data-acao="adicionar" data-id="${id}">
          <svg class="icone"><use href="#i-carrinho"/></svg> Adicionar
        </button>`;
    }
    return `
      <div class="seletor seletor-grande">
        <button type="button" data-acao="decrementar" data-id="${id}" aria-label="Diminuir quantidade">
          <svg class="icone"><use href="#i-${quantidade === 1 ? "lixo" : "menos"}"/></svg>
        </button>
        <span aria-live="polite">${quantidade} no carrinho</span>
        <button type="button" data-acao="incrementar" data-id="${id}" aria-label="Aumentar quantidade">
          <svg class="icone"><use href="#i-mais"/></svg>
        </button>
      </div>`;
  }
}

class ItemCarrinho {
  constructor(produto, quantidade = 1) {
    this.produto = produto;
    this.quantidade = quantidade;
  }

  get subtotal() {
    return this.produto.preco * this.quantidade;
  }

  get economia() {
    return Math.max(0, this.produto.precoAntigo - this.produto.preco) * this.quantidade;
  }

  render() {
    const p = this.produto;
    return `
      <div class="carrinho-item">
        <img src="imagens/${encodeURI(p.imagem)}" alt="" />
        <div class="carrinho-item-info">
          <strong>${escapeHTML(p.nome)}</strong>
          <span>${formatarMoeda(p.preco)} cada</span>
          <div class="seletor">
            <button type="button" data-acao="decrementar" data-id="${p.id}" aria-label="Diminuir quantidade de ${escapeHTML(p.nome)}">
              <svg class="icone"><use href="#i-menos"/></svg>
            </button>
            <span>${this.quantidade}</span>
            <button type="button" data-acao="incrementar" data-id="${p.id}" aria-label="Aumentar quantidade de ${escapeHTML(p.nome)}">
              <svg class="icone"><use href="#i-mais"/></svg>
            </button>
          </div>
        </div>
        <div class="carrinho-item-lado">
          <strong>${formatarMoeda(this.subtotal)}</strong>
          <button type="button" class="btn-remover" data-acao="remover" data-id="${p.id}" aria-label="Remover ${escapeHTML(p.nome)}">
            <svg class="icone"><use href="#i-lixo"/></svg>
          </button>
        </div>
      </div>`;
  }
}

/* ---------- Modal genérico (Esc, clique fora, foco) ---------- */

class Modal {
  constructor(id, { aoAbrir } = {}) {
    this.el = document.getElementById(id);
    this.aoAbrir = aoAbrir;
    this.focoAnterior = null;

    this.el.addEventListener("click", e => {
      if (e.target === this.el || e.target.closest("[data-fechar]")) this.fechar();
    });
  }

  get aberto() {
    return !this.el.hidden;
  }

  abrir() {
    this.focoAnterior = document.activeElement;
    this.el.hidden = false;
    document.body.classList.add("travado");
    requestAnimationFrame(() => this.el.classList.add("aberto"));
    this.aoAbrir?.();
    (this.el.querySelector("input, .btn-primario") || this.el).focus();
  }

  fechar() {
    if (!this.aberto) return;
    this.el.classList.remove("aberto");
    this.el.hidden = true;
    document.body.classList.remove("travado");
    this.focoAnterior?.focus?.();
  }
}

/* ---------- Carrinho ---------- */

const CHAVE_CARRINHO = "acaimart:carrinho";

class Carrinho {
  constructor(loja) {
    this.loja = loja;
    this.itens = [];

    this.el = document.getElementById("carrinho");
    this.overlayEl = document.getElementById("carrinho-overlay");
    this.listaEl = document.getElementById("carrinho-lista");
    this.subtotalEl = document.getElementById("carrinho-subtotal");
    this.economiaEl = document.getElementById("carrinho-economia");
    this.totalEl = document.getElementById("carrinho-total");
    this.badgeEl = document.getElementById("badge-carrinho");
    this.btnFinalizar = document.getElementById("btn-finalizar");

    this.overlayEl.addEventListener("click", () => this.fechar());
    document.getElementById("btn-fechar-carrinho").addEventListener("click", () => this.fechar());
    this.btnFinalizar.addEventListener("click", () => this.finalizar());
    this.listaEl.addEventListener("click", e => this.loja.tratarAcao(e));
  }

  get aberto() {
    return this.el.classList.contains("aberto");
  }

  /** Restaura o carrinho salvo no navegador. */
  restaurar() {
    const salvo = armazenamento.ler(CHAVE_CARRINHO) || [];
    this.itens = salvo
      .map(({ id, quantidade }) => {
        const produto = this.loja.produtoPorId(id);
        return produto && quantidade > 0 ? new ItemCarrinho(produto, quantidade) : null;
      })
      .filter(Boolean);
    this.atualizar();
  }

  _salvar() {
    armazenamento.gravar(
      CHAVE_CARRINHO,
      this.itens.map(i => ({ id: i.produto.id, quantidade: i.quantidade }))
    );
  }

  _item(id) {
    return this.itens.find(i => i.produto.id === id);
  }

  quantidadeDe(id) {
    return this._item(id)?.quantidade || 0;
  }

  adicionar(id) {
    const produto = this.loja.produtoPorId(id);
    if (!produto) return;

    const item = this._item(id);
    if (item) item.quantidade++;
    else this.itens.push(new ItemCarrinho(produto));

    this.atualizar(id);
    this._animarBadge();
    toast(`${produto.nome} adicionado ao carrinho`, "sucesso");
  }

  incrementar(id) {
    const item = this._item(id);
    if (!item) return;
    item.quantidade++;
    this.atualizar(id);
  }

  decrementar(id) {
    const item = this._item(id);
    if (!item) return;
    if (item.quantidade > 1) {
      item.quantidade--;
      this.atualizar(id);
    } else {
      this.remover(id);
    }
  }

  remover(id) {
    this.itens = this.itens.filter(i => i.produto.id !== id);
    this.atualizar(id);
  }

  get total() {
    return this.itens.reduce((acc, i) => acc + i.subtotal, 0);
  }

  get economia() {
    return this.itens.reduce((acc, i) => acc + i.economia, 0);
  }

  get totalItens() {
    return this.itens.reduce((acc, i) => acc + i.quantidade, 0);
  }

  /**
   * Re-renderiza o painel e o badge. Se `idAlterado` for informado,
   * atualiza também o botão daquele produto na vitrine.
   */
  atualizar(idAlterado) {
    const qtd = this.totalItens;
    this.badgeEl.textContent = qtd > 99 ? "99+" : qtd;
    this.badgeEl.hidden = qtd === 0;
    document.getElementById("btn-carrinho")
      .setAttribute("aria-label", `Abrir carrinho (${qtd} ${qtd === 1 ? "item" : "itens"})`);

    this.listaEl.innerHTML = this.itens.length
      ? this.itens.map(i => i.render()).join("")
      : `<div class="carrinho-vazio">
           <svg class="icone"><use href="#i-carrinho"/></svg>
           <p>Seu carrinho está vazio.</p>
           <span>Adicione produtos para vê-los aqui.</span>
         </div>`;

    this.subtotalEl.textContent = formatarMoeda(this.total + this.economia);
    this.economiaEl.textContent = `− ${formatarMoeda(this.economia)}`;
    this.economiaEl.parentElement.hidden = this.economia <= 0;
    this.totalEl.textContent = formatarMoeda(this.total);
    this.btnFinalizar.disabled = this.itens.length === 0;

    if (idAlterado !== undefined) this.loja.atualizarAcaoDoCard(idAlterado);
    this._salvar();
  }

  _animarBadge() {
    this.badgeEl.classList.remove("pulo");
    void this.badgeEl.offsetWidth; // reinicia a animação
    this.badgeEl.classList.add("pulo");
  }

  abrir() {
    this.el.classList.add("aberto");
    this.overlayEl.classList.add("aberto");
    this.el.setAttribute("aria-hidden", "false");
    document.body.classList.add("travado");
    document.getElementById("btn-fechar-carrinho").focus();
  }

  fechar() {
    if (!this.aberto) return;
    this.el.classList.remove("aberto");
    this.overlayEl.classList.remove("aberto");
    this.el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("travado");
  }

  finalizar() {
    if (this.itens.length === 0) {
      toast("Adicione produtos antes de finalizar!");
      return;
    }
    if (!this.loja.usuario) {
      toast("Faça login para finalizar a compra.");
      this.fechar();
      this.loja.modalLogin.abrir();
      return;
    }

    const qtd = this.totalItens;
    document.getElementById("pedido-texto").innerHTML =
      `Obrigado, <b>${escapeHTML(this.loja.usuario)}</b>! ` +
      `Seu pedido com ${qtd} ${qtd === 1 ? "item" : "itens"} no valor de ` +
      `<b>${formatarMoeda(this.total)}</b> foi recebido.`;

    const ids = this.itens.map(i => i.produto.id);
    this.itens = [];
    this.atualizar();
    ids.forEach(id => this.loja.atualizarAcaoDoCard(id));
    this.fechar();
    this.loja.modalPedido.abrir();
  }
}

/* ---------- Loja ---------- */

const CHAVE_USUARIO = "acaimart:usuario";

class Loja {
  constructor() {
    this.catalogo = [];
    this.usuarios = [];
    this.usuario = null;

    this.filtro = { categoria: "Todos", termo: "", ordem: "relevancia" };
    this.promoAtiva = false;
    this._primeiraVerificacao = false;

    this.produtosEl = document.getElementById("produtos");
    this.filtrosEl = document.getElementById("filtros");
    this.contagemEl = document.getElementById("contagem");

    this.carrinho = new Carrinho(this);
    this.modalLogin = new Modal("modal-login", {
      aoAbrir: () => {
        document.getElementById("form-login").reset();
        document.getElementById("login-erro").textContent = "";
      },
    });
    this.modalPedido = new Modal("modal-pedido");

    this._ligarEventos();
  }

  async iniciar() {
    document.getElementById("ano").textContent = new Date().getFullYear();

    try {
      const dados = await carregarDados();
      if (!Array.isArray(dados.produtos) || !Array.isArray(dados.usuarios)) {
        throw new Error("Estrutura de dados incorreta no JSON.");
      }

      this.catalogo = dados.produtos.map(d => new Produto(d));
      this.usuarios = dados.usuarios;

      this._atualizarSeloHero();
      this._restaurarUsuario();
      this.carrinho.restaurar();
      this._renderFiltros();
      this._verificarPromocao(); // já renderiza o catálogo
      setInterval(() => this._verificarPromocao(), 1000);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      this.contagemEl.textContent = "";
      this.produtosEl.innerHTML = renderEstado({
        icone: "⚠️",
        titulo: "Não foi possível carregar os produtos",
        texto: "Abra o projeto por um servidor local (ex.: Live Server) e tente novamente.",
      });
      toast("Erro ao carregar os dados.", "erro");
    }
  }

  produtoPorId(id) {
    return this.catalogo.find(p => p.id === id);
  }

  /* ----- Eventos ----- */

  _ligarEventos() {
    const busca = document.getElementById("busca");
    busca.addEventListener("input", () => {
      this.filtro.termo = busca.value;
      this._renderCatalogo();
    });

    document.getElementById("ordem").addEventListener("change", e => {
      this.filtro.ordem = e.target.value;
      this._renderCatalogo();
    });

    this.filtrosEl.addEventListener("click", e => {
      const btn = e.target.closest("button[data-categoria]");
      if (!btn) return;
      this.filtro.categoria = btn.dataset.categoria;
      this.filtrosEl.querySelectorAll("button").forEach(b =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      this._renderCatalogo();
    });

    this.produtosEl.addEventListener("click", e => this.tratarAcao(e));

    document.getElementById("btn-carrinho").addEventListener("click", () => this.carrinho.abrir());
    document.getElementById("area-usuario").addEventListener("click", e => {
      if (e.target.closest("#btn-login")) this.modalLogin.abrir();
      if (e.target.closest("#btn-sair")) this.sair();
    });

    document.getElementById("form-login").addEventListener("submit", e => {
      e.preventDefault();
      this.entrar();
    });

    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      this.modalLogin.fechar();
      this.modalPedido.fechar();
      this.carrinho.fechar();
    });
  }

  /** Trata cliques em botões com data-acao (vitrine e carrinho). */
  tratarAcao(e) {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const acoes = {
      adicionar: () => this.carrinho.adicionar(id),
      incrementar: () => this.carrinho.incrementar(id),
      decrementar: () => this.carrinho.decrementar(id),
      remover: () => this.carrinho.remover(id),
    };
    acoes[btn.dataset.acao]?.();
  }

  /* ----- Catálogo ----- */

  _listaVisivel() {
    const { categoria, termo, ordem } = this.filtro;
    const t = normalizar(termo);

    const lista = this.catalogo.filter(p =>
      (categoria === "Todos" || p.categoria === categoria) &&
      (!t || normalizar(p.nome).includes(t) || normalizar(p.categoria).includes(t))
    );

    const ordenadores = {
      "menor-preco": (a, b) => a.preco - b.preco,
      "maior-preco": (a, b) => b.preco - a.preco,
      desconto: (a, b) => b.percentualDesconto - a.percentualDesconto,
      nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
    };
    if (ordenadores[ordem]) lista.sort(ordenadores[ordem]);
    return lista;
  }

  _renderCatalogo() {
    const lista = this._listaVisivel();
    const n = lista.length;
    this.contagemEl.textContent = `${n} ${n === 1 ? "produto encontrado" : "produtos encontrados"}`;

    this.produtosEl.innerHTML = n
      ? lista.map(p => p.renderCard(this.carrinho.quantidadeDe(p.id))).join("")
      : renderEstado({
          icone: "🔍",
          titulo: "Nenhum produto encontrado",
          texto: "Tente outro termo de busca ou escolha outra categoria.",
        });
  }

  /** Atualiza só o botão de um card (sem re-renderizar a grade inteira). */
  atualizarAcaoDoCard(id) {
    const alvo = this.produtosEl.querySelector(`.produto[data-id="${id}"] .produto-acao`);
    if (alvo) alvo.innerHTML = Produto.renderAcao(id, this.carrinho.quantidadeDe(id));
  }

  _renderFiltros() {
    const contagem = {};
    this.catalogo.forEach(p => (contagem[p.categoria] = (contagem[p.categoria] || 0) + 1));
    const categorias = [["Todos", this.catalogo.length], ...Object.entries(contagem)];

    this.filtrosEl.innerHTML = categorias.map(([c, n]) => `
      <button type="button" data-categoria="${escapeHTML(c)}" aria-pressed="${c === this.filtro.categoria}">
        ${escapeHTML(c)} <span class="chip-contagem">${n}</span>
      </button>`).join("");
  }

  _atualizarSeloHero() {
    const max = Math.max(0, ...this.catalogo.map(p => p.percentualDesconto));
    const selo = document.querySelector(".hero-selo");
    if (selo && max > 0) selo.textContent = `Até ${max}% OFF`;
  }

  /* ----- Promoção relâmpago (um único relógio, checado a cada segundo) ----- */

  _verificarPromocao() {
    const { ativa, restaSeg } = estadoPromocao();
    const banner = document.getElementById("banner-relampago");

    if (ativa !== this.promoAtiva || !this._primeiraVerificacao) {
      const mudou = this._primeiraVerificacao && ativa !== this.promoAtiva;
      this._primeiraVerificacao = true;
      this.promoAtiva = ativa;
      Produto.promocaoAtiva = ativa;
      banner.hidden = !ativa;

      this._renderCatalogo();
      this.carrinho.atualizar(); // preços do carrinho mudam junto

      if (mudou) {
        toast(ativa
          ? "⚡ Promoção relâmpago ativada! R$ 1,00 OFF em tudo!"
          : "A promoção relâmpago foi encerrada.");
      }
    }

    if (ativa) {
      document.getElementById("relampago-timer").textContent = `Termina em ${formatarTempo(restaSeg)}`;
    }
  }

  /* ----- Usuário ----- */

  entrar() {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const senha = document.getElementById("login-senha").value;
    const erroEl = document.getElementById("login-erro");

    if (!email || !senha) {
      erroEl.textContent = "Preencha e-mail e senha.";
      return;
    }

    const usuario = this.autenticarUsuario(email, senha);
    if (!usuario) {
      erroEl.textContent = "E-mail ou senha inválidos.";
      document.getElementById("login-senha").select();
      return;
    }

    this._definirUsuario(usuario.nome);
    armazenamento.gravar(CHAVE_USUARIO, usuario.nome, sessionStorage);
    this.modalLogin.fechar();
    toast(`Bem-vindo, ${usuario.nome}!`, "sucesso");
  }

  autenticarUsuario(email, senha) {
    return this.usuarios.find(u => u.email.toLowerCase() === email && u.password === senha);
  }

  _restaurarUsuario() {
    const nome = armazenamento.ler(CHAVE_USUARIO, sessionStorage);
    if (nome && this.usuarios.some(u => u.nome === nome)) this._definirUsuario(nome);
  }

  _definirUsuario(nome) {
    this.usuario = nome;
    const inicial = escapeHTML(nome.charAt(0).toUpperCase());
    document.getElementById("area-usuario").innerHTML = `
      <div class="usuario-logado">
        <span class="avatar" aria-hidden="true">${inicial}</span>
        <span class="usuario-nome">${escapeHTML(nome)}</span>
        <button type="button" class="btn-icone" id="btn-sair" aria-label="Sair da conta" title="Sair">
          <svg class="icone"><use href="#i-sair"/></svg>
        </button>
      </div>`;
  }

  sair() {
    this.usuario = null;
    armazenamento.remover(CHAVE_USUARIO, sessionStorage);
    document.getElementById("area-usuario").innerHTML = `
      <button type="button" class="btn-topo" id="btn-login">
        <svg class="icone"><use href="#i-usuario"/></svg>
        <span>Entrar</span>
      </button>`;
    toast("Você saiu da conta.");
  }
}

const loja = new Loja();
document.addEventListener("DOMContentLoaded", () => loja.iniciar());
