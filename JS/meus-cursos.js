document.addEventListener("DOMContentLoaded", carregarMeusCursos);

// CARREGA CURSOS MATRICULADOS
async function carregarMeusCursos() {
  //onde os cards serão inseridos.
  const lista = document.getElementById("lista-disciplinas");

  // se esta logado
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    lista.innerHTML = "<p>Você não está logado.</p>";
    return;
  }

  //Pegando o ID do aluno
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

    //id aluno igual userId
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

  //Se deu tudo certo, chama as disciplinas
  renderDisciplinas(matriculas);
}

function renderDisciplinas(matriculas) { //cria os cards
  const lista = document.getElementById("lista-disciplinas");
  lista.innerHTML = ""; //Remove cursos antigos e add novos

  matriculas.forEach((m) => {
    const c = m.curso;

//Cria o card:
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
  planoModal.innerHTML = curso.descricao.replace(/\n/g, "<br>"); //troca quebras de linha por <br> para manter o formato do texto

  modal.style.display = "flex";
};

//Botão para voltar ao painel do aluno
document.getElementById("btn-ir-painel").addEventListener("click", () => {
    window.location.href = "painel-aluno.html";
});
// 4. FECHAR MODAL
document.getElementById("fechar-modal").addEventListener("click", () => {
  document.getElementById("modal-disciplina").style.display = "none";
});