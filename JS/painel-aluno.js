document.addEventListener('DOMContentLoaded', async () => {

// Autenticação e checagem de permissão
  const user = await checkAuthAndRole('aluno', 'login.html');
  if (!user) return;

  // captura elementos do htnml
    const elNomePerfil = document.getElementById('nome-perfil-aluno');
  const elMatriculaPerfil = document.getElementById('matricula-perfil-aluno');
  const elNomeCompleto = document.getElementById('nome-aluno-completo');
  const elMatriculaCompleto = document.getElementById('matricula-aluno-completo');
  const elCursoAluno = document.getElementById('curso-aluno');
  const tbodyNotas = document.querySelector('#tabela-notas tbody');

  //verifica se tudo existe
  if (!elNomePerfil || !elMatriculaPerfil || !elNomeCompleto || !elMatriculaCompleto || !tbodyNotas) {
    console.error("❌ ERRO: Elementos do HTML não encontrados. Verifique os IDs do painel do aluno.");
    return;
  }

  //  buscando dados do aluno no supabase
  const { data: alunoData, error: alunoErr } = await supabase
    .from('usuarios')
    .select('nome, email')
    .eq('id', user.id)
    .single();

  if (alunoErr) {
    console.error('Erro ao buscar usuário:', alunoErr);
    alert('Erro ao carregar informações do aluno.');
    return;
  }

// se tiver o nomme no banco busca o nome, se não pega o email antes do @
  const nomeCompleto = alunoData?.nome ?? user.email.split('@')[0];
  const primeiroNome = nomeCompleto.split(' ')[0];

  // Preenche os dados na tela
  elNomePerfil.innerText = primeiroNome;
  elMatriculaPerfil.innerText = user.id.slice(0, 8) + '...';
  elNomeCompleto.innerText = nomeCompleto;
  elMatriculaCompleto.innerText = user.id;

  // BUSCAR CURSO DO ALUNO
  const { data: matriculaCurso, error: matErr } = await supabase
    .from('matriculas')
    .select(`
      curso_id,
      cursos ( nome )
    `)
    .eq('aluno_id', user.id)
    .single();

    //se n achar
  if (matErr || !matriculaCurso) {
    tbodyNotas.innerHTML = '<tr><td colspan="4">Nenhuma nota encontrada.</td></tr>';
    if (elCursoAluno) elCursoAluno.innerText = 'Não vinculado';
    console.warn("Aluno sem curso:", matErr);
    return;
  }

  const cursoId = matriculaCurso.curso_id;
  const nomeCurso = matriculaCurso.cursos?.nome ?? 'Curso não encontrado';
  if (elCursoAluno) elCursoAluno.innerText = nomeCurso;

  // FUNÇÃO PARA CARREGAR NOTAS
  async function carregarNotas() {
    tbodyNotas.innerHTML = ''; //limpando a tabela

    //consukta no supabase
    const { data: notas, error: notasErr } = await supabase
      .from('notas')
      .select('*')
      .eq('aluno_id', user.id)
      .eq('curso_id', cursoId)
      .order('data', { ascending: false });

      //erro na consulta
    if (notasErr) {
      console.error('Erro ao carregar notas:', notasErr);
      tbodyNotas.innerHTML = '<tr><td colspan="4">Erro ao carregar notas.</td></tr>';
      return;
    }

    //n tem notas
    if (!notas || notas.length === 0) {
      tbodyNotas.innerHTML = '<tr><td colspan="4">Nenhuma nota lançada.</td></tr>';
      return;
    }

    // preenche a linha da tabela com dados.
    for (const n of notas) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nomeCurso}</td>
        <td>${n.atividade}</td>
        <td>${n.nota}</td>
        <td>${new Date(n.data).toLocaleDateString('pt-BR')}</td>
      `;
      tbodyNotas.appendChild(tr);
    }
  }


  carregarNotas();

  // atualização automatica das notas
  try {
    const channel = supabase
      .channel(`public:notas:aluno:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notas',
          filter: `aluno_id=eq.${user.id}`
        },
        async (payload) => {
          const novaNota = payload.new;

          if (novaNota.curso_id === cursoId) {
            carregarNotas(); // atualiza na hora
          }
        }
      )
      .subscribe();

      // remove o canal ao sair da página
    window.addEventListener('beforeunload', () => {
      try { supabase.removeChannel(channel); } catch {}
    });

  } catch (e) {
    console.warn('Realtime indisponível:', e);
  }

  // DROPDOWN PERFIL
  const btnPerfil = document.getElementById("btn-perfil-aluno");
  const menuPerfil = document.getElementById("menu-aluno");

  if (btnPerfil && menuPerfil) {
     //quando clica no botão do perfil
    btnPerfil.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPerfil.classList.toggle("ativo");
    });

    //quando clica fora do menu, fecha ele
    document.addEventListener("click", () => {
      menuPerfil.classList.remove("ativo");
    });
  }

});