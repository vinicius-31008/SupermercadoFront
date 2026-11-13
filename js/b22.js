/* ============================================================
   Açaí Mart — inventário da Sala B22
   ============================================================ */

const ICONES_B22 = {
  "Eletrônico": "💻",
  "Elétrico": "⚡",
  "Eletroeletrônico": "🔌",
  "Móveis": "🪑",
  "Acessório": "🔧",
  "Armazenamento de dados": "💾",
  "Adorno": "🖥️",
};

class ItemB22 {
  constructor({ id, descricao, quantidade, categoria }) {
    this.id = id;
    this.descricao = descricao;
    this.quantidade = quantidade;
    this.categoria = categoria;
  }

  get icone() {
    return ICONES_B22[this.categoria] || "📦";
  }

  renderCard() {
    const qtdBaixa = this.quantidade <= 1;
    return `
      <article class="item-b22">
        <div class="item-b22-topo">
          <span class="item-b22-icone" aria-hidden="true">${this.icone}</span>
          <span class="produto-categoria">${escapeHTML(this.categoria)}</span>
        </div>
        <h3>${escapeHTML(this.descricao)}</h3>
        <div class="item-b22-qtd${qtdBaixa ? " baixa" : ""}">
          <span>Quantidade</span>
          <strong>${this.quantidade}</strong>
        </div>
        <span class="item-b22-id">#${String(this.id).padStart(2, "0")}</span>
      </article>`;
  }
}

const b22Page = {
  itens: [],
  filtro: { categoria: "Todos", termo: "" },

  async iniciar() {
    document.getElementById("ano").textContent = new Date().getFullYear();
    this._ligarEventos();

    try {
      const dados = await carregarDados();
      if (!Array.isArray(dados.b22)) throw new Error("Estrutura de dados incorreta no JSON.");

      this.itens = dados.b22.map(d => new ItemB22(d));
      this._renderEstatisticas();
      this._renderFiltros();
      this._renderLista();
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      document.getElementById("itens-b22").innerHTML = renderEstado({
        icone: "⚠️",
        titulo: "Não foi possível carregar os itens",
        texto: "Abra o projeto por um servidor local (ex.: Live Server) e tente novamente.",
      });
      toast("Erro ao carregar os dados.", "erro");
    }
  },

  _ligarEventos() {
    const busca = document.getElementById("busca-b22");
    busca.addEventListener("input", () => {
      this.filtro.termo = busca.value;
      this._renderLista();
    });

    const filtros = document.getElementById("filtros-b22");
    filtros.addEventListener("click", e => {
      const btn = e.target.closest("button[data-categoria]");
      if (!btn) return;
      this.filtro.categoria = btn.dataset.categoria;
      filtros.querySelectorAll("button").forEach(b =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      this._renderLista();
    });
  },

  _porCategoria() {
    const mapa = new Map();
    this.itens.forEach(i => {
      const atual = mapa.get(i.categoria) || { itens: 0, unidades: 0 };
      atual.itens++;
      atual.unidades += i.quantidade;
      mapa.set(i.categoria, atual);
    });
    return mapa;
  },

  _renderEstatisticas() {
    const porCategoria = this._porCategoria();
    const unidades = this.itens.reduce((acc, i) => acc + i.quantidade, 0);

    document.getElementById("stat-itens").textContent = this.itens.length;
    document.getElementById("stat-unidades").textContent = unidades;
    document.getElementById("stat-categorias").textContent = porCategoria.size;

    const ordenado = [...porCategoria].sort((a, b) => b[1].unidades - a[1].unidades);
    const max = ordenado[0]?.[1].unidades || 1;
    document.getElementById("resumo-categorias").innerHTML = ordenado.map(([cat, { unidades: u }]) => `
      <li>
        <div class="barra-rotulo"><span>${ICONES_B22[cat] || "📦"} ${escapeHTML(cat)}</span><strong>${u}</strong></div>
        <div class="barra-trilho"><div class="barra-valor" style="width:${(u / max) * 100}%"></div></div>
      </li>`).join("");
  },

  _renderFiltros() {
    const categorias = [["Todos", this.itens.length], ...[...this._porCategoria()].map(([c, v]) => [c, v.itens])];
    document.getElementById("filtros-b22").innerHTML = categorias.map(([c, n]) => `
      <button type="button" data-categoria="${escapeHTML(c)}" aria-pressed="${c === this.filtro.categoria}">
        ${escapeHTML(c)} <span class="chip-contagem">${n}</span>
      </button>`).join("");
  },

  _renderLista() {
    const { categoria, termo } = this.filtro;
    const t = normalizar(termo);
    const lista = this.itens.filter(i =>
      (categoria === "Todos" || i.categoria === categoria) &&
      (!t || normalizar(i.descricao).includes(t) || normalizar(i.categoria).includes(t))
    );

    const n = lista.length;
    document.getElementById("contagem-b22").textContent =
      `${n} ${n === 1 ? "item encontrado" : "itens encontrados"}`;

    document.getElementById("itens-b22").innerHTML = n
      ? lista.map(i => i.renderCard()).join("")
      : renderEstado({
          icone: "🔍",
          titulo: "Nenhum item encontrado",
          texto: "Tente outro termo de busca ou escolha outra categoria.",
        });
  },
};

document.addEventListener("DOMContentLoaded", () => b22Page.iniciar());
