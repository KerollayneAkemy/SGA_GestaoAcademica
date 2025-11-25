// Rodar como module
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. sessão e role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'login.html';

    const { data: userData, error: errUser } = await supabase
      .from('usuarios')
      .select('id, nome, email, user_role')
      .eq('id', session.user.id)
      .single();

    if (errUser || !userData || userData.user_role !== 'admin') {
      alert('Acesso negado!');
      return window.location.href = 'login.html';
    }

    // preencher perfil dropdown (verificando existência)
    const nomePerfilEl = document.getElementById('nome-perfil-admin');
    const emailPerfilEl = document.getElementById('email-perfil-admin');
    if (nomePerfilEl) nomePerfilEl.textContent = userData.nome || 'Administrador';
    if (emailPerfilEl) emailPerfilEl.textContent = userData.email || '';

    // dropdown toggle (verificando existência)
    const btnPerfil = document.getElementById('btn-perfil-admin');
    const menuPerfil = document.getElementById('menu-admin');
    if (btnPerfil && menuPerfil) {
      btnPerfil.addEventListener('click', e => { e.stopPropagation(); menuPerfil.classList.toggle('ativo'); });
      document.addEventListener('click', () => menuPerfil.classList.remove('ativo'));
    }

    // logout (nav + menu) — checar elementos
    const btnLogoutNav = document.getElementById('btn-logout-admin');
    const btnLogoutMenu = document.getElementById('logout-admin');
    if (btnLogoutNav) btnLogoutNav.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
    if (btnLogoutMenu) btnLogoutMenu.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });

    // modal editar curso elementos (verificar)
    const modalEditar = document.getElementById('modal-editar-curso');
    const closeEditar = document.getElementById('close-editar-curso');
    if (closeEditar && modalEditar) {
      closeEditar.addEventListener('click', () => modalEditar.style.display = 'none');
      window.addEventListener('click', (e) => { if (e.target === modalEditar) modalEditar.style.display = 'none'; });
    }

    // carregar dados do painel
    await carregarSelectProfessores();
    await listarCursos();
    await listarProfessores();
    await listarAlunos();
    await listarMensagens();

    // enviar cadastro de curso (verificar form)
    const formAdmin = document.getElementById('form-admin');
    if (formAdmin) {
      formAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('curso')?.value.trim();
        const duracao = document.getElementById('duracao')?.value.trim();
        const descricao = document.getElementById('descricao')?.value.trim();
        const professorId = document.getElementById('select-professor-vinculo')?.value;

        if (!nome || !duracao || !descricao || !professorId) return alert('Preencha todos os campos');

        const { error } = await supabase.from('cursos').insert([{
          id: crypto.randomUUID(),
          nome, duracao, descricao, professor_id: professorId
        }]);

        if (error) return alert('Erro ao cadastrar curso: ' + error.message);
        alert(`Curso '${nome}' cadastrado!`);
        e.target.reset();
        listarCursos();
      });
    }

    // envio edição curso (verificar form)
    const formEditar = document.getElementById('form-editar-curso');
    if (formEditar) {
      formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-curso-id')?.value;
        const nome = document.getElementById('edit-curso-nome')?.value.trim();
        const duracao = document.getElementById('edit-curso-duracao')?.value.trim();
        const descricao = document.getElementById('edit-curso-descricao')?.value.trim();
        const professorId = document.getElementById('edit-curso-professor')?.value;

        if (!id || !nome || !duracao || !descricao || !professorId) return alert('Preencha todos os campos');

        const { error } = await supabase.from('cursos').update({
          nome, duracao, descricao, professor_id: professorId
        }).eq('id', id);

        if (error) return alert('Erro ao atualizar curso: ' + error.message);
        alert('Curso atualizado com sucesso!');
        if (modalEditar) modalEditar.style.display = 'none';
        listarCursos();
      });
    }

  } catch (err) {
    console.error('Erro no DOMContentLoaded:', err);
    alert('Ocorreu um erro ao carregar o painel. Veja console para detalhes.');
  }
});

// carregar select de professores (usado tanto no cadastro quanto no modal)
async function carregarSelectProfessores() {
  try {
    const { data: professores, error } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('user_role', 'professor')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar professores:', error);
      return;
    }

    const select = document.getElementById('select-professor-vinculo');
    const selectEdit = document.getElementById('edit-curso-professor');

    if (select) select.innerHTML = '<option value="">-- Selecionar Professor --</option>';
    if (selectEdit) selectEdit.innerHTML = '<option value="">-- Selecionar Professor --</option>';

    (professores || []).forEach(p => {
      if (select) select.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
      if (selectEdit) selectEdit.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });
  } catch (err) {
    console.error('Erro em carregarSelectProfessores:', err);
  }
}
window.carregarSelectProfessores = carregarSelectProfessores;

// listar cursos com Editar + Excluir
async function listarCursos() {
  try {
    const { data: cursos, error } = await supabase
      .from('cursos')
      .select('id, nome, professor_id')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar cursos:', error);
      return;
    }

    const { data: professores } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('user_role', 'professor');

    const tbody = document.getElementById('tabela-cursos-corpo');
    if (!tbody) {
      console.warn('tabela-cursos-corpo não encontrada no DOM');
      return;
    }
    tbody.innerHTML = '';

    (cursos || []).forEach(c => {
      const prof = (professores || []).find(p => p.id === c.professor_id) || null;
      const profNome = prof ? prof.nome : 'Professor não encontrado';

      // criar linha com botões (corrigido: passou c.id corretamente)
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${profNome}</td>
        <td>
          <button class="btn-editar" onclick="editarCurso('${c.id}')">Editar</button>
          <button class="btn-excluir" onclick="deletarCurso('${c.id}')">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro em listarCursos:', err);
  }
}
window.listarCursos = listarCursos;

// deletar curso
window.deletarCurso = async (id) => {
  try {
    if (!id) return alert('ID inválido para exclusão.');
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    const { error } = await supabase.from('cursos').delete().eq('id', id);
    if (error) return alert('Erro ao deletar curso: ' + error.message);
    listarCursos();
  } catch (err) {
    console.error('Erro em deletarCurso:', err);
    alert('Erro ao excluir curso. Veja console.');
  }
};

// editar curso -> abre modal preenchido
window.editarCurso = async (id) => {
  try {
    if (!id) return alert('ID inválido para edição.');
    // buscar curso
    const { data: curso, error } = await supabase.from('cursos').select('*').eq('id', id).single();
    if (error || !curso) return alert('Erro ao buscar dados do curso.');

    // preencher modal
    const editIdEl = document.getElementById('edit-curso-id');
    const editNomeEl = document.getElementById('edit-curso-nome');
    const editDurEl = document.getElementById('edit-curso-duracao');
    const editDescEl = document.getElementById('edit-curso-descricao');
    const editProfEl = document.getElementById('edit-curso-professor');

    if (editIdEl) editIdEl.value = curso.id;
    if (editNomeEl) editNomeEl.value = curso.nome || '';
    if (editDurEl) editDurEl.value = curso.duracao || '';
    if (editDescEl) editDescEl.value = curso.descricao || '';

    // garantir select de professores carregado
    await carregarSelectProfessores();
    if (editProfEl) editProfEl.value = curso.professor_id || '';

    // abrir modal
    const modal = document.getElementById('modal-editar-curso');
    if (modal) modal.style.display = 'block';
  } catch (err) {
    console.error('Erro em editarCurso:', err);
    alert('Erro ao abrir modal de edição. Veja console.');
  }
};

// listar professores (apenas Excluir)
async function listarProfessores() {
  try {
    const { data: professores, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('user_role', 'professor')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar professores:', error);
      return;
    }

    const tbody = document.querySelector('#tabela-professores tbody');
    if (!tbody) {
      console.warn('tabela-professores tbody não encontrada');
      return;
    }
    tbody.innerHTML = '';
    if (professores && professores.length) {
      professores.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.nome}</td>
          <td>${p.email}</td>
          <td>
            <button class="btn-excluir-usuario" onclick="deletarUsuario('${p.id}')">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="3">Nenhum professor cadastrado.</td></tr>';
    }
  } catch (err) {
    console.error('Erro em listarProfessores:', err);
  }
}
window.listarProfessores = listarProfessores;

// listar alunos (Promover)
async function listarAlunos() {
  try {
    const { data: alunos, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('user_role', 'aluno')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar alunos:', error);
      return;
    }

    const tbody = document.querySelector('#tabela-alunos tbody');
    if (!tbody) {
      console.warn('tabela-alunos tbody não encontrada');
      return;
    }
    tbody.innerHTML = '';

    if (alunos && alunos.length) {
      alunos.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${a.nome}</td>
          <td>${a.email}</td>
          <td>
            <button class="btn-acao" onclick="promoverAluno('${a.id}')">Promover a Professor</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="3">Nenhum aluno cadastrado.</td></tr>';
    }
  } catch (err) {
    console.error('Erro em listarAlunos:', err);
  }
}
window.listarAlunos = listarAlunos;

// listar mensagens (Respondido + Excluir)
async function listarMensagens() {
  try {
    const { data: mensagens, error } = await supabase
      .from('contatos')
      .select('*')
      .order('data_envio', { ascending: false });

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return;
    }

    const tbody = document.querySelector('#tabela-contatos tbody');
    if (!tbody) {
      console.warn('tabela-contatos tbody não encontrada');
      return;
    }
    tbody.innerHTML = '';

    if (mensagens && mensagens.length) {
      mensagens.forEach(m => {
        const msgCurta = m.mensagem && m.mensagem.length > 60 ? m.mensagem.substring(0,60) + '...' : (m.mensagem || '');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.nome}</td>
          <td>${m.email}</td>
          <td>${msgCurta}</td>
          <td>
            <button class="btn-excluir-usuario" onclick="deletarMensagem('${m.id}')">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4">Nenhuma mensagem recebida.</td></tr>';
    }
  } catch (err) {
    console.error('Erro em listarMensagens:', err);
  }
}
window.listarMensagens = listarMensagens;

// promover aluno
window.promoverAluno = async (alunoId) => {
  try {
    if (!alunoId) return alert('ID inválido.');
    if (!confirm('Tem certeza que deseja promover este aluno a professor?')) return;
    const { error } = await supabase.from('usuarios').update({ user_role: 'professor' }).eq('id', alunoId);
    if (error) return alert('Erro ao promover aluno: ' + error.message);
    alert('Aluno promovido a professor!');
    listarProfessores(); carregarSelectProfessores(); listarAlunos();
  } catch (err) {
    console.error('Erro em promoverAluno:', err);
    alert('Erro ao promover aluno. Veja console.');
  }
};

// deletar usuário
window.deletarUsuario = async (id) => {
  try {
    if (!id) return alert('ID inválido.');
    if (!confirm('Tem certeza? Isso irá excluir o usuário de forma permanente.')) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return alert('Erro ao deletar usuário: ' + error.message);
    listarProfessores(); listarAlunos(); carregarSelectProfessores();
  } catch (err) {
    console.error('Erro em deletarUsuario:', err);
    alert('Erro ao excluir usuário. Veja console.');
  }
};

// deletar mensagem
window.deletarMensagem = async (id) => {
  try {
    if (!id) return alert('ID inválido.');
    if (!confirm('Excluir esta mensagem?')) return;
    const { error } = await supabase.from('contatos').delete().eq('id', id);
    if (error) return alert('Erro ao excluir mensagem: ' + error.message);
    listarMensagens();
  } catch (err) {
    console.error('Erro em deletarMensagem:', err);
    alert('Erro ao excluir mensagem. Veja console.');
  }
};