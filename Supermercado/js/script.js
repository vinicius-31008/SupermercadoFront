
class Produto {
  constructor({ id, nome, preco, precoAntigo, imagem, categoria }) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.precoAntigo = precoAntigo;
    this.imagem = imagem;
    this.categoria = categoria;
  }

  precoFormatado() {
    return this.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  precoAntigoFormatado() {
    return this.precoAntigo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  renderCard() {
    return `
      <div class="product" data-id="${this.id}" data-categoria="${this.categoria}">
        <img src="imagens/${this.imagem}" alt="${this.nome}">
        <h3>${this.nome}</h3>
        <div class="old-price">De ${this.precoAntigoFormatado()}</div>
        <div class="price">${this.precoFormatado()}</div>
        <button onclick="loja.carrinho.adicionar(${this.id})">
          🛒 Adicionar ao carrinho
        </button>
      </div>`;
  }
}

class ItemCarrinho {
  constructor(produto) {
    this.produto = produto;
    this.quantidade = 1;
  }

  get subtotal() {
    return this.produto.preco * this.quantidade;
  }

  subtotalFormatado() {
    return this.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  renderItem() {
    return `
      <div class="carrinho-item" id="item-${this.produto.id}">
        <img src="imagens/${this.produto.imagem}" alt="${this.produto.nome}">
        <div class="carrinho-item-info">
          <strong>${this.produto.nome}</strong>
          <span>${this.produto.precoFormatado()} cada</span>
          <div class="carrinho-item-qtd">
            <button onclick="loja.carrinho.decrementar(${this.produto.id})">−</button>
            <span>${this.quantidade}</span>
            <button onclick="loja.carrinho.incrementar(${this.produto.id})">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:bold;color:#6a1b9a">${this.subtotalFormatado()}</div>
          <button class="carrinho-item-remover" onclick="loja.carrinho.remover(${this.produto.id})" title="Remover">✕</button>
        </div>
      </div>`;
  }
}

class Carrinho {
  constructor() {
    this.itens = [];
    this.drawerEl = document.getElementById("carrinho-drawer");
    this.overlayEl = document.getElementById("carrinho-overlay");
    this.listaEl = document.getElementById("carrinho-lista");
    this.totalEl = document.getElementById("carrinho-total");
    this.badgeEl = document.getElementById("badge-carrinho");
  }

  _buscarItem(id) {
    return this.itens.find(i => i.produto.id === id) || null;
  }

  adicionar(produtoId) {
    const produto = loja.catalogo.find(p => p.id === produtoId);
    if (!produto) return;

    const item = this._buscarItem(produtoId);
    if (item) {
      item.quantidade++;
    } else {
      this.itens.push(new ItemCarrinho(produto));
    }

    this._atualizar();
    loja.toast(`"${produto.nome}" adicionado ao carrinho!`);
  }

  remover(produtoId) {
    this.itens = this.itens.filter(i => i.produto.id !== produtoId);
    this._atualizar();
  }

  incrementar(produtoId) {
    const item = this._buscarItem(produtoId);
    if (item) { item.quantidade++; this._atualizar(); }
  }

  decrementar(produtoId) {
    const item = this._buscarItem(produtoId);
    if (!item) return;
    if (item.quantidade > 1) {
      item.quantidade--;
      this._atualizar();
    } else {
      this.remover(produtoId);
    }
  }

  get total() {
    return this.itens.reduce((acc, i) => acc + i.subtotal, 0);
  }

  get totalItens() {
    return this.itens.reduce((acc, i) => acc + i.quantidade, 0);
  }

  _atualizar() {
    const badge = this.badgeEl;
    badge.textContent = this.totalItens;
    badge.style.display = this.totalItens > 0 ? "flex" : "none";

    if (this.itens.length === 0) {
      this.listaEl.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
    } else {
      this.listaEl.innerHTML = this.itens.map(i => i.renderItem()).join("");
    }

    this.totalEl.textContent = this.total.toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
  }

  abrir() {
    this.drawerEl.classList.add("aberto");
    this.overlayEl.classList.add("aberto");
  }

  fechar() {
    this.drawerEl.classList.remove("aberto");
    this.overlayEl.classList.remove("aberto");
  }

  finalizar() {
    if (this.itens.length === 0) {
      loja.toast("Adicione produtos antes de finalizar!");
      return;
    }
    if (!loja.usuario) {
      loja.toast("Faça login para finalizar a compra!");
      this.fechar();
      loja.abrirLogin();
      return;
    }
    const totalFmt = this.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    alert(`Pedido finalizado!\nTotal: ${totalFmt}\nObrigado, ${loja.usuario}!`);
    this.itens = [];
    this._atualizar();
    this.fechar();
  }
}

class Login {
  constructor() {
    this.modalEl = document.getElementById("modal-login");
    this.erroEl = document.getElementById("login-erro");
  }

  abrir() {
    this.modalEl.classList.add("aberto");
    this.erroEl.textContent = "";
    document.getElementById("login-email").value = "";
    document.getElementById("login-senha").value = "";
  }

  fechar() {
    this.modalEl.classList.remove("aberto");
  }

  tentar() {
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value.trim();

    const usuario = loja.usuarios.find(
      u => u.email === email && u.password === senha
    );

    if (usuario) {
      loja.definirUsuario(usuario.nome);
      this.fechar();
      loja.toast(`Bem-vindo, ${usuario.nome}!`);
    } else {
      this.erroEl.textContent = "E-mail ou senha inválidos.";
    }
  }
}

class Loja {
  constructor() {
    this.catalogo = [];
    this.usuario = []; 
    this.carrinho = new Carrinho();
    this.login = new Login();
    this.usuario = null;
    this._toastTimer = null;
  }

  async iniciar() {
  try {
    // Acessa o db.json usando o caminho relativo correto
    const resp = await fetch("JSON/db.json");
    
    if (!resp.ok) {
      throw new Error(`Erro ao carregar o JSON: ${resp.statusText}`);
    }

    const dados = await resp.json();
    console.log(dados);  // Verifique os dados no console

    if (!dados.produtos || !dados.usuarios) {
      throw new Error("Estrutura de dados incorreta no JSON.");
    }

    // Atualiza os produtos e usuários
    this.catalogo = dados.produtos.map(d => new Produto(d));
    this.usuarios = dados.usuarios;

    // Renderiza os produtos
    this._renderCatalogo(this.catalogo);
    this._renderFiltros();
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    loja.toast("Erro ao carregar os dados. Tente novamente.");
  }
}

  autenticarUsuario(email, senha) {
    return this.usuarios.find(u => u.email === email && u.senha === senha);
  }

  _renderCatalogo(lista) {
    document.getElementById("products").innerHTML = lista.map(p => p.renderCard()).join("");
  }

  _renderFiltros() {
    const categorias = ["Todos", ...new Set(this.catalogo.map(p => p.categoria))];
    const container = document.getElementById("filtros");
    container.innerHTML = categorias.map(c =>
      `<button class="${c === 'Todos' ? 'ativo' : ''}" onclick="loja.filtrar('${c}', this)">${c}</button>`
    ).join("");
  }

  filtrar(categoria, btnEl) {
    document.querySelectorAll(".filtros button").forEach(b => b.classList.remove("ativo"));
    btnEl.classList.add("ativo");

    document.querySelectorAll(".product").forEach(card => {
      const match = categoria === "Todos" || card.dataset.categoria === categoria;
      card.classList.toggle("product-hidden", !match);
    });
  }

  buscar(termo) {
    const t = termo.toLowerCase();
    document.querySelectorAll(".product").forEach(card => {
      const nome = card.querySelector("h3").textContent.toLowerCase();
      card.classList.toggle("product-hidden", !nome.includes(t));
    });
  }

  definirUsuario(nome) {
    this.usuario = nome;
    const area = document.getElementById("area-usuario");
    area.innerHTML = `
      <div class="usuario-logado">
        ${nome}
        <button onclick="loja.sair()" title="Sair">✕</button>
      </div>`;
  }

  sair() {
    this.usuario = null;
    const area = document.getElementById("area-usuario");
    area.innerHTML = `<a onclick="loja.abrirLogin()">Login</a>`;
    loja.toast("Você saiu da conta.");
  }

  abrirLogin() {
    this.login.abrir();
  }

  toast(mensagem) {
    const el = document.getElementById("toast");
    el.textContent = mensagem;
    el.classList.add("visivel");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove("visivel"), 3000);
  }
}

const loja = new Loja();
document.addEventListener("DOMContentLoaded", () => loja.iniciar());
