document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-contato");
    const successMsg = document.querySelector(".success-msg");
    const errorApiContainer = document.getElementById("form-error-message"); 

    // Função de tratamento do envio
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Limpa erros de API anteriores
        if (errorApiContainer) errorApiContainer.style.display = 'none';

        const nome = form.nome.value.trim();
        const email = form.email.value.trim();
        const mensagem = form.mensagem.value.trim();
        
        let valid = true;

        // Validação simples dos campos (Evita envio de campos vazios)
        form.querySelectorAll(".form-group").forEach(group => {
            const input = group.querySelector("input, textarea");
            const error = group.querySelector(".error-msg");
            if (!input.value.trim()) {
                error.style.display = "block";
                valid = false;
            } else {
                error.style.display = "none";
            }
        });

        // Se a validação falhar, para a função aqui
        if (!valid) {
            console.log("Validação falhou.");
            return;
        }

        // Inserção de Dados no Supabase
        try {
            if (!window.supabase) {
                 throw new Error("Cliente Supabase (window.supabase) não inicializado corretamente.");
            }

            // Inicia a inserção
            const { error } = await window.supabase
                .from('contatos') // Sua tabela: contatos
                .insert([{ nome: nome, email: email, mensagem: mensagem }]);

            if (error) {
                console.error('Erro no Supabase:', error);
                // Exibe erro de API/RLS para o usuário
                if (errorApiContainer) {
                    errorApiContainer.textContent = `Erro: ${error.message}. Verifique a RLS.`;
                    errorApiContainer.style.display = 'block';
                }
                return; 
            }

            // Sucesso
            successMsg.style.display = "block";
            form.reset();

            setTimeout(() => successMsg.style.display = "none", 3000);

        } catch (err) {
            console.error('Erro de rede ou inicialização:', err);
            if (errorApiContainer) {
                errorApiContainer.textContent = 'Ocorreu um erro inesperado. Verifique sua conexão e o console.';
                errorApiContainer.style.display = 'block';
            }
        }
    });
});
