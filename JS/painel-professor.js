document.addEventListener("DOMContentLoaded", async () => {
  console.log("Painel do Professor carregando...");

  //PEGAR USUÁRIO LOGADO
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !session) {
    alert("Sessão expirada. Faça login novamente.");
    return window.location.href = "login.html";
  }

  const professorId = session.user.id;
  console.log("Professor logado:", professorId);

  // BUSCAR DADOS DO PROFESSOR
  const { data: professor, error: professorError } = await supabase
    .from("usuarios")
    .select("nome, email, user_role")
    .eq("id", professorId)
    .single();

  if (professorError || !professor || professor.user_role !== "professor") {
    alert("Acesso negado! Somente professores podem acessar este painel.");
    return window.location.href = "login.html";
  }

  // ATUALIZAR ELEMENTOS DO PERFIL
  ["nome-perfil-professor", "nome-professor-completo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = professor.nome;
  });

  ["email-perfil-professor", "email-professor-completo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = professor.email;
  });

  // BUSCAR CURSOS DO PROFESSOR
  const { data: cursos, error: cursosError } = await supabase
    .from("cursos")
    .select("*")
    .eq("professor_id", professorId);

  if (cursosError) {
    console.error(cursosError);
    alert("Erro ao carregar cursos.");
    return;
  }

  const listaCursos = document.getElementById("lista-cursos-professor");
  const selectCursoNotas = document.getElementById("cursoSelecionado");

  listaCursos.innerHTML = "";
  selectCursoNotas.innerHTML = `<option value="">Selecione o Curso</option>`;

  cursos.forEach(curso => {
    listaCursos.innerHTML += `
      <div class="curso-item">
        <h3>${curso.nome}</h3>
        <p><strong>ID:</strong> ${curso.id}</p>
      </div>
    `;
    selectCursoNotas.innerHTML += `<option value="${curso.id}">${curso.nome}</option>`;
  });

  //CARREGAR ALUNOS DO CURSO SELECIONADO
  selectCursoNotas.addEventListener("change", async (e) => {
    const cursoId = e.target.value;

    const { data: matriculas, error } = await supabase
      .from("matriculas")
      .select(`
        aluno_id,
        aluno:usuarios(id, nome)
      `)
      .eq("curso_id", cursoId);

    if (error) {
      console.error(error);
      alert("Erro ao carregar alunos.");
      return;
    }

    const selectAluno = document.getElementById("alunoSSelecionado");
    selectAluno.innerHTML = `<option value="">Selecione o Aluno</option>`;

    matriculas.forEach(m => {
      if (m.aluno) {
        selectAluno.innerHTML += `<option value="${m.aluno_id}">${m.aluno.nome}</option>`;
      }
    });
  });

  //LANÇAR NOTA
  document.getElementById("form-lancamento").addEventListener("submit", async (e) => {
    e.preventDefault();

    const aluno = document.getElementById("alunoSSelecionado").value;
    const curso = document.getElementById("cursoSelecionado").value;
    const atividade = document.getElementById("tipoAtividade").value;
    const nota = Number(document.getElementById("nota").value);

    if (!aluno || !curso) {
      alert("Selecione o curso e o aluno!");
      return;
    }

    const { error } = await supabase.from("notas").insert({
      aluno_id: aluno,
      curso_id: curso,
      atividade,
      nota
    });

    if (error) {
      console.error(error);
      alert("Erro ao lançar nota.");
      return;
    }

    alert("Nota lançada com sucesso!");
    e.target.reset();
    carregarHistorico();
  });

  // HISTÓRICO DE NOTAS
  async function carregarHistorico() {
    const tabela = document.querySelector("#tabela-historico-notas tbody");

    const { data: historico, error: histError } = await supabase
      .from("notas")
      .select(`
        id,
        atividade,
        nota,
        data,
        aluno:usuarios!notas_aluno_id_fkey(id, nome),
        curso:cursos!notas_curso_id_fkey(id, nome, professor_id)
      `)
      .eq("curso.professor_id", professorId);

    if (histError) {
      console.error(histError);
      return;
    }

    tabela.innerHTML = "";

    historico.forEach(item => {
      tabela.innerHTML += `
        <tr>
          <td>${item.aluno?.nome ?? "—"}</td>
          <td>${item.curso?.nome ?? "—"}</td>
          <td>${item.atividade}</td>
          <td>${item.nota}</td>
          <td>${new Date(item.data).toLocaleDateString("pt-BR")}</td>
        </tr>
      `;
    });
  }

  carregarHistorico();

  // DROPDOWN PERFIL
  const btnPerfil = document.getElementById("btn-perfil-professor");
  const menuPerfil = document.getElementById("menu-professor");

  if (btnPerfil && menuPerfil) {
    btnPerfil.addEventListener("click", e => {
      e.stopPropagation();
      menuPerfil.classList.toggle("ativo");
    });

    document.addEventListener("click", () => menuPerfil.classList.remove("ativo"));
  }

  // LOGOUT
  const logoutBtn = document.getElementById("logout-professor");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
});