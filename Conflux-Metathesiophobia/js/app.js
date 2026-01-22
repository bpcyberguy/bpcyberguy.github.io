(() => {
    const sess = window.ConfluxAuth.requireAuthOrRedirect("../index.html");
    if (!sess) return;

    const nameEl = document.getElementById("playerName");
    if (nameEl) nameEl.textContent = sess.name || "Operator";

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => window.ConfluxAuth.logout());

    const diag = document.getElementById("diagnosticsLink");
    if (diag) diag.addEventListener("click", (e) => {
        e.preventDefault();
        window.ConfluxARG?.toggleDiagnostics?.();
    });
})();