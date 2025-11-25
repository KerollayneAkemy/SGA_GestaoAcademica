document.addEventListener("DOMContentLoaded", carregarMeusCursos);

// CARREGAR CURSOS MATRICULADOS
async function carregarMeusCursos() {
  const lista = document.getElementById("lista-disciplinas");

  // Verificar sessão
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    lista.innerHTML = "<p>Você não está logado.</p>";
    return;
  }

  const userId = session.user.id;

  // Buscar matrículas + dados completos do curso
  const { data: matriculas, error } = await supabase
    .from("matriculas")
    .select(`
      id,
      curso:curso_id (
        id,
        nome,
        duracao,
        descricao,
        professor_id,
        usuarios:professor_id ( nome )
      )
    `)
    .eq("aluno_id", userId);

  if (error) {
    console.error(error);
    lista.innerHTML = "<p>Erro ao carregar seus cursos. Tente novamente.</p>";
    return;
  }

  if (!matriculas || matriculas.length === 0) {
    lista.innerHTML =
      "<p>Você ainda não está matriculado em nenhum curso.</p>";
    return;
  }

  renderDisciplinas(matriculas);
}

// RENDERIZAR DISCIPLINAS (CARDS)
function renderDisciplinas(matriculas) {
  const lista = document.getElementById("lista-disciplinas");
  lista.innerHTML = "";

  matriculas.forEach((m) => {
    const c = m.curso;

    const card = document.createElement("div");
    card.classList.add("card-disciplina");

    card.innerHTML = `
      <h3>${c.nome}</h3>
      <p><strong>Professor:</strong> ${c.usuarios?.nome ?? "—"}</p>
      <p><strong>Duração:</strong> ${c.duracao}</p>
      <button class="btn-roxo" onclick="abrirDetalhes('${c.id}')">
        Ver Detalhes
      </button>
    `;

    lista.appendChild(card);
  });
}

// ABRIR DETALHES DO CURSO NO MODAL
window.abrirDetalhes = async function (cursoId) {
  const modal = document.getElementById("modal-disciplina");
  const tituloModal = document.getElementById("titulo-modal");
  const professorModal = document.getElementById("professor-modal");
  const cargaModal = document.getElementById("carga-modal");
  const turmaModal = document.getElementById("turma-modal");
  const planoModal = document.getElementById("plano-modal");

  // Buscar detalhes do curso
  const { data: curso, error } = await supabase
    .from("cursos")
    .select(`
      id,
      nome,
      duracao,
      descricao,
      professor_id,
      usuarios:professor_id ( nome )
    `)
    .eq("id", cursoId)
    .single();

  if (error || !curso) {
    console.error(error);
    alert("Erro ao carregar detalhes do curso.");
    return;
  }

  // Preencher dados no modal
  tituloModal.textContent = curso.nome;
  professorModal.textContent = curso.usuarios?.nome ?? "—";
  cargaModal.textContent = curso.duracao;
  turmaModal.textContent = "—"; // SEM TURMA
  planoModal.innerHTML = curso.descricao.replace(/\n/g, "<br>");

  modal.style.display = "flex";
};

document.getElementById("btn-ir-painel").addEventListener("click", () => {
    window.location.href = "painel-aluno.html";
});
// 4. FECHAR MODAL
document.getElementById("fechar-modal").addEventListener("click", () => {
  document.getElementById("modal-disciplina").style.display = "none";
});
