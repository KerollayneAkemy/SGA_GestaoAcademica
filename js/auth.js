const users = {
  "aluno@sga.com": { password: "123", type: "aluno", name: "João Silva" },
  "admin@sga.com": { password: "123", type: "admin", name: "Administrador" },
  "professor@sga.com": {
    password: "123",
    type: "professor",
    name: "Prof. Maria",
  },
};

function login(email, password) {
  const user = users[email];
  if (user && user.password === password) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user.type;
  }
  return null;
}

function register(name, email, password) {
  if (users[email]) {
    return false;
  }
  users[email] = { password, type: "aluno", name };
  return true;
}

function isLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function logout() {
  localStorage.removeItem("currentUser");
}
