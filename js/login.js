const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault(); //impede que o navegador recarregue a página

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim(); //Aqui pegamos o e-mail e senha digitados.

    if (!email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    // Login com Supabase
    const { data: loginData, error: loginError } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    }); //verifica se o e-mail existe e se a senha está correta.

    if (loginError) {
        alert("Erro no login: " + loginError.message);
        console.error(loginError);
        return;
    }

    const user = loginData.user; //Se o login der certo, pega os dados do usuário logado.
    if (!user) {
        alert("Erro inesperado: usuário não encontrado.");
        return;
    }

    // Buscando os dados na tabela
    const { data: userData, error: userDataError } = await window.supabase
        .from("usuarios")
        .select("user_role") //papel da pessoa
        .eq("id", user.id)
        .single();

        //se nao achar
    if (userDataError || !userData) {
        alert("Erro ao buscar dados do usuário: " + (userDataError?.message || "Dados não encontrados"));
        console.error(userDataError);
        return;
    }

    const role = userData.user_role;

    // Redirecionamento baseado na role
    switch (role) {
        case "aluno":
            window.location.href = "painel-aluno.html";
            break;
        case "professor":
            window.location.href = "painel-professor.html";
            break;
        case "admin":
            window.location.href = "painel-admin.html";
            break;
        default:
            alert("Role desconhecida. Contate o suporte.");
            await window.supabase.auth.signOut();
            break;
    }
});


