document.addEventListener('DOMContentLoaded', async () => {

  // AUTENTICAÇÃO
  const user = await checkAuthAndRole('aluno', 'login.html');
  if (!user) return;

  // CAPTURAR ELEMENTOS — COM VERIFICAÇÃO
    const elNomePerfil = document.getElementById('nome-perfil-aluno');
  const elMatriculaPerfil = document.getElementById('matricula-perfil-aluno');
  const elNomeCompleto = document.getElementById('nome-aluno-completo');
  const elMatriculaCompleto = document.getElementById('matricula-aluno-completo');
  const elCursoAluno = document.getElementById('curso-aluno');
  const tbodyNotas = document.querySelector('#tabela-notas tbody');

  if (!elNomePerfil || !elMatriculaPerfil || !elNomeCompleto || !elMatriculaCompleto || !tbodyNotas) {
    console.error("❌ ERRO: Elementos do HTML não encontrados. Verifique os IDs do painel do aluno.");
    return;
  }

  //  BUSCAR DADOS DO ALUNO
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

  const nomeCompleto = alunoData?.nome ?? user.email.split('@')[0];
  const primeiroNome = nomeCompleto.split(' ')[0];

  // Preencher UI
  elNomePerfil.innerText = primeiroNome;
  elMatriculaPerfil.innerText = user.id.slice(0, 8) + '...';
  elNomeCompleto.innerText = nomeCompleto;
  elMatriculaCompleto.innerText = user.id;

  // BUSCAR CURSO DO ALUNO — SELECT CORRIGIDO (SEM ERRO 406)
  const { data: matriculaCurso, error: matErr } = await supabase
    .from('matriculas')
    .select(`
      curso_id,
      cursos ( nome )
    `)
    .eq('aluno_id', user.id)
    .single();

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
    tbodyNotas.innerHTML = '';

    const { data: notas, error: notasErr } = await supabase
      .from('notas')
      .select('*')
      .eq('aluno_id', user.id)
      .eq('curso_id', cursoId)
      .order('data', { ascending: false });

    if (notasErr) {
      console.error('Erro ao carregar notas:', notasErr);
      tbodyNotas.innerHTML = '<tr><td colspan="4">Erro ao carregar notas.</td></tr>';
      return;
    }

    if (!notas || notas.length === 0) {
      tbodyNotas.innerHTML = '<tr><td colspan="4">Nenhuma nota lançada.</td></tr>';
      return;
    }

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

  // Carrega imediatamente
  carregarNotas();

  // REALTIME — 100% FUNCIONAL
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
    btnPerfil.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPerfil.classList.toggle("ativo");
    });

    document.addEventListener("click", () => {
      menuPerfil.classList.remove("ativo");
    });
  }

});