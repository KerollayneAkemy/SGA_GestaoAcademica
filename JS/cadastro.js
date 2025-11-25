document.getElementById("btnCadastrar").addEventListener("click", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        // Cadastro no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: { nome: nome } // o trigger handle_new_user no SQL define o user_role
            }
        });

        if (error) {
            console.error("Erro no cadastro:", error);
            alert("Erro ao cadastrar: " + error.message);
            return;
        }

        alert("Cadastro realizado com sucesso! Verifique seu e-mail.");
        window.location.href = "login.html";

    } catch (err) {
        console.error("Erro inesperado:", err);
        alert("Ocorreu um erro inesperado. Tente novamente.");
    }
});
document.getElementById('form-professor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nomeProfessor').value.trim();
    const email = document.getElementById('emailProfessor').value.trim();
    const senha = '123456'; // Pode gerar aleatório ou pedir no form

    if (!nome || !email) return alert('Preencha todos os campos');

    await criarProfessorAuth(nome, email, senha);
});