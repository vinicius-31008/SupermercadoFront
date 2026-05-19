
const PROMOCAO_DESCONTO = 1.00; 

function verificarPromocaoRelampago() {
  const agora = new Date();
  const hora  = agora.getHours(); 
  return hora >= 15 && hora < 17; 
}

function horasAteProxima() {
  const agora = new Date();
  const hora  = agora.getHours();
  const min   = agora.getMinutes();
  const seg   = agora.getSeconds();

  if (hora >= 15 && hora < 17) {
    
    const restaSeg = (17 - hora - 1) * 3600 + (59 - min) * 60 + (60 - seg);
    return { ativa: true, restaSeg };
  }
  return { ativa: false, restaSeg: 0 };
}



class Produto {
  constructor({ id, nome, preco, precoAntigo, imagem, categoria }) {
    this.id = id;
    this.nome = nome;
    this.precoOriginal = preco;      
    this.preco = preco;             
    this.precoAntigo = precoAntigo;
    this.imagem = imagem;
    this.categoria = categoria;
  }

  aplicarDesconto(desconto) {
    this.preco = Math.max(0, this.precoOriginal - desconto);
  }

  removerDesconto() {
    this.preco = this.precoOriginal;
  }

  precoFormatado() {
    return this.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  precoAntigoFormatado() {
    return this.precoAntigo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  renderCard() {
    const emPromocao = verificarPromocaoRelampago();
    const badgeHTML  = emPromocao
      ? `<div class="badge-relampago">⚡ -R$ 1,00</div>`
      : "";
    const precoDeHTML = emPromocao
      ? `<div class="old-price">De ${this.precoAntigoFormatado()} → <s>${this.precoOriginal.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</s></div>`
      : `<div class="old-price">De ${this.precoAntigoFormatado()}</div>`;

    return `
      <div class="product${emPromocao ? " em-promocao" : ""}" data-id="${this.id}" data-categoria="${this.categoria}">
        ${badgeHTML}
        <img src="imagens/${this.imagem}" alt="${this.nome}">
        <h3>${this.nome}</h3>
        ${precoDeHTML}
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
    const resp = await fetch("JSON/db.json");
    
    if (!resp.ok) {
      throw new Error(`Erro ao carregar o JSON: ${resp.statusText}`);
    }

    const dados = await resp.json();

    if (!dados.produtos || !dados.usuarios) {
      throw new Error("Estrutura de dados incorreta no JSON.");
    }

    this.catalogo = dados.produtos.map(d => new Produto(d));
    this.usuarios = dados.usuarios;

    if (verificarPromocaoRelampago()) {
      this.catalogo.forEach(p => p.aplicarDesconto(PROMOCAO_DESCONTO));
    }

    this._renderCatalogo(this.catalogo);
    this._renderFiltros();
    this._iniciarBannerPromocao();  
    this._agendarVerificacaoHoraria();
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    loja.toast("Erro ao carregar os dados. Tente novamente.");
  }
}

  _iniciarBannerPromocao() {
    const { ativa, restaSeg } = horasAteProxima();

    const anterior = document.getElementById("banner-relampago");
    if (anterior) anterior.remove();

    if (!ativa) return;

    const banner = document.createElement("div");
    banner.id = "banner-relampago";
    banner.innerHTML = `
      <span class="relampago-icone">⚡</span>
      <span class="relampago-texto">PROMOÇÃO RELÂMPAGO — R$ 1,00 OFF EM TODOS OS PRODUTOS!</span>
      <span class="relampago-timer" id="relampago-timer"></span>
    `;
    
    document.querySelector("main").insertAdjacentElement("beforebegin", banner);

    let seg = restaSeg;
    const timerEl = document.getElementById("relampago-timer");

    const tick = () => {
      if (seg <= 0) {
        banner.remove();
        
        this.catalogo.forEach(p => p.removerDesconto());
        this._renderCatalogo(this.catalogo);
        this.toast("Promoção relâmpago encerrada!");
        return;
      }
      const h = Math.floor(seg / 3600);
      const m = Math.floor((seg % 3600) / 60);
      const s = seg % 60;
      timerEl.textContent = `Termina em: ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      seg--;
      setTimeout(tick, 1000);
    };
    tick();
  }

  _agendarVerificacaoHoraria() {
    setInterval(() => {
      const ativa = verificarPromocaoRelampago();
      const bannerExiste = !!document.getElementById("banner-relampago");

      if (ativa && !bannerExiste) {
        
        this.catalogo.forEach(p => p.aplicarDesconto(PROMOCAO_DESCONTO));
        this._renderCatalogo(this.catalogo);
        this._iniciarBannerPromocao();
        this.toast("⚡ Promoção relâmpago ativada! R$ 1,00 OFF em tudo!");
      } else if (!ativa && bannerExiste) {
        
        this.catalogo.forEach(p => p.removerDesconto());
        this._renderCatalogo(this.catalogo);
        document.getElementById("banner-relampago")?.remove();
      }
    }, 60_000); 
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
