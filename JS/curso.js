const listaCursos = document.querySelector(".curso-list");
const filtroInput = document.getElementById("filtro");
const modal = document.getElementById("course-modal");
const closeModal = document.querySelector(".close-btn");
const btnInscrever = document.querySelector(".btn-inscrever-modal");

let cursosData = [];
let cursoAtualAberto = null;  // ← usado para reabrir modal após login

document.addEventListener("DOMContentLoaded", () => {
  verificarRetornoDoLogin();
  fetchCursos();
});

// verificar se o usuario voltou do login
function verificarRetornoDoLogin() {
  const cursoId = localStorage.getItem("reabrir_modal_curso");

  if (cursoId) {
    localStorage.removeItem("reabrir_modal_curso");
    setTimeout(() => abrirModal(cursoId), 300);
  }
}

// carregar cursos
async function fetchCursos() {
  const { data, error } = await supabase
    .from("cursos")
    .select(`
      id,
      nome,
      duracao,
      descricao,
      professor_id,
      usuarios:professor_id ( id, nome )
    `);

  if (error) {
    console.error(error);
    listaCursos.innerHTML = "<p>Erro ao carregar cursos.</p>";
    return;
  }

  cursosData = data.map((c) => ({
    id: String(c.id),
    nome: c.nome,
    duracao: c.duracao,
    descricao: c.descricao,
    professorNome: c.usuarios?.nome ?? "—",
  }));

  renderCursos(cursosData);
}

// RENDERIZAR CARDS
function renderCursos(cursos) {
  listaCursos.innerHTML = "";

  if (!cursos.length) {
    listaCursos.innerHTML = "<p>Nenhum curso encontrado.</p>";
    return;
  }

  cursos.forEach((c) => {
    const card = document.createElement("div");
    card.className = "curso-card";

    card.innerHTML = `
      <h3>${c.nome}</h3>
      <p><strong>Professor:</strong> ${c.professorNome}</p>
      <p><strong>Duração:</strong> ${c.duracao}</p>

      <button class="btn-detalhes" onclick="abrirModal('${c.id}')">
        Ver Detalhes
      </button>
    `;

    listaCursos.appendChild(card);
  });
}


// MODAL
window.abrirModal = function (id) {
  const curso = cursosData.find((x) => String(x.id) === String(id));
  if (!curso) return;

  cursoAtualAberto = id;

  document.getElementById("modal-title").innerText = curso.nome;
  document.getElementById("modal-details-duration").innerText =
    `Duração: ${curso.duracao}`;
  document.getElementById("modal-details-text").innerText = curso.descricao;

  btnInscrever.onclick = () => inscreverCurso(id, curso.nome);

  modal.style.display = "block";
};

closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// filtro cursos
filtroInput.addEventListener("input", (e) => {
  const termo = e.target.value.toLowerCase();
  const filtrados = cursosData.filter(
    (c) =>
      c.nome.toLowerCase().includes(termo) ||
      c.professorNome.toLowerCase().includes(termo)
  );
  renderCursos(filtrados);
});

// inscrever curso
async function inscreverCurso(cursoId, cursoNome) {
  // Sessão atual
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // salva o curso e volta para ele depois
    localStorage.setItem("redirect_after_login", window.location.href);
    localStorage.setItem("reabrir_modal_curso", cursoId);

    alert("Você precisa estar logado para se inscrever.");
    window.location.href = "login.html";
    return;
  }

  const userId = session.user.id;

  // Verificar role
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("user_role")
    .eq("id", userId)
    .single();

  if (!usuario || usuario.user_role !== "aluno") {
    alert("Somente alunos podem se inscrever.");
    return;
  }

  // Verificar matrícula existente
  const { data: jaMatriculado } = await supabase
    .from("matriculas")
    .select("id")
    .eq("aluno_id", userId)
    .eq("curso_id", cursoId)
    .limit(1);

  if (jaMatriculado && jaMatriculado.length > 0) {
    alert("Você já está inscrito neste curso.");
    modal.style.display = "none";
    return;
  }

  // Criar matrícula
  const { error } = await supabase
    .from("matriculas")
    .insert([{ aluno_id: userId, curso_id: cursoId }]);

  if (error) {
    console.error(error);
    alert("Erro ao se inscrever: " + error.message);
    return;
  }

  alert(`Inscrição realizada com sucesso no curso: ${cursoNome}`);
  modal.style.display = "none";

  window.location.href = "meuscursos.html";
}
