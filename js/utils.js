/* ============================================================
   Utilitários compartilhados entre as páginas
   ============================================================ */

const moedaBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um número como moeda brasileira (R$ 0,00). */
function formatarMoeda(valor) {
  return moedaBRL.format(valor);
}

/** Remove acentos e deixa em minúsculas — usado nas buscas. */
function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Escapa caracteres especiais antes de inserir texto via innerHTML. */
function escapeHTML(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Leitura/escrita segura no storage (pode falhar em aba anônima). */
const armazenamento = {
  ler(chave, storage = localStorage) {
    try {
      const bruto = storage.getItem(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch {
      return null;
    }
  },
  gravar(chave, valor, storage = localStorage) {
    try {
      storage.setItem(chave, JSON.stringify(valor));
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  },
  remover(chave, storage = localStorage) {
    try {
      storage.removeItem(chave);
    } catch {
      /* ignora */
    }
  },
};

/** Notificação flutuante (toast). */
const toast = (() => {
  let timer = null;
  return (mensagem, tipo = "info") => {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = mensagem;
    el.dataset.tipo = tipo;
    el.classList.add("visivel");
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("visivel"), 3000);
  };
})();

/** Carrega o arquivo de dados (db.json). */
async function carregarDados() {
  const resp = await fetch("JSON/db.json");
  if (!resp.ok) throw new Error(`Erro ao carregar o JSON: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

/** Mensagem padrão de estado vazio / erro dentro de uma grade. */
function renderEstado({ icone, titulo, texto }) {
  return `
    <div class="estado">
      <div class="estado-icone" aria-hidden="true">${icone}</div>
      <h3>${escapeHTML(titulo)}</h3>
      <p>${escapeHTML(texto)}</p>
    </div>`;
}

/** Sombra no header ao rolar a página. */
document.addEventListener("scroll", () => {
  document.querySelector(".topo")?.classList.toggle("rolado", window.scrollY > 8);
}, { passive: true });
