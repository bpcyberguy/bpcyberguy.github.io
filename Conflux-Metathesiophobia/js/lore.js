(async () => {
    const sess = window.ConfluxAuth.requireAuthOrRedirect("../index.html");
    if (!sess) return;

    const list = document.getElementById("loreList");
    const hint = document.getElementById("unlockHint");

    const res = await fetch("../data/lore.json", { cache: "no-store" });
    const lore = await res.json();

    function render() {
        const unlocked = new Set(window.ConfluxAuth.getUnlockFlags());
        list.innerHTML = "";

        for (const entry of lore.entries) {
            const prereqOk = (entry.required || []).every(f => unlocked.has(f));
            const isUnlocked = unlocked.has(entry.flag) && prereqOk;

            const el = document.createElement("article");
            el.className = "lore";
            el.innerHTML = `
        <h3 class="h3">${entry.title}</h3>
        ${isUnlocked
                    ? `<p>${entry.content}</p>`
                    : `<p class="locked">[LOCKED] Authorization required.</p>`
                }
        <div class="lore__meta">
          <span class="pill">${isUnlocked ? "UNSEALED" : "SEALED"}</span>
          <span class="pill">FLAG: ${entry.flag}</span>
        </div>
      `;
            list.appendChild(el);
        }
    }

    async function tryUnlock(code) {
        const codeHash = await window.ConfluxAuth.sha256Hex(code);
        const target = lore.entries.find(e => e.unlockCodeHash && e.unlockCodeHash === codeHash);
        if (!target) return { ok: false, msg: "No matching authorization." };

        const flags = window.ConfluxAuth.getUnlockFlags();
        flags.push(target.flag);
        window.ConfluxAuth.setUnlockFlags(flags);
        return { ok: true, msg: `Unlocked: ${target.title}` };
    }

    document.getElementById("unlockForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("unlockCode").value.trim();
        if (!code) return;
        const r = await tryUnlock(code);
        hint.textContent = r.msg;
        render();
    });

    render();
})();