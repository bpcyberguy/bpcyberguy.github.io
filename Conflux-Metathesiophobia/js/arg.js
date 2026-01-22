(() => {
    function b64(s) {
        try { return atob(s.replace(/\s/g, "")); } catch { return ""; }
    }

    // Decode any data-fragment attributes if player inspects DOM or enables overlay.
    function scanFragments() {
        const nodes = document.querySelectorAll("[data-fragment]");
        return [...nodes].map(n => b64(n.getAttribute("data-fragment") || "")).filter(Boolean);
    }

    // Simple diagnostics overlay (Lusion-ish vibe without WebGL).
    const overlay = document.createElement("div");
    overlay.className = "diagnostics hidden";
    overlay.innerHTML = `
    <div class="diagnostics__panel">
      <div class="diagnostics__head">
        <strong>System Diagnostics</strong>
        <button class="btn btn--ghost" id="diagClose">Close</button>
      </div>
      <pre class="diagnostics__log" id="diagLog"></pre>
    </div>
  `;
    document.body.appendChild(overlay);

    function logLines(lines) {
        const el = document.getElementById("diagLog");
        el.textContent = lines.join("\n");
    }

    function open() {
        overlay.classList.remove("hidden");
        const fragments = scanFragments();
        const unlocked = window.ConfluxAuth?.getUnlockFlags?.() || [];
        logLines([
            "Anomaly detected.",
            "Analyzing intrusion.",
            "They observe with watchful eyes.",
            "",
            `Fragments found: ${fragments.length}`,
            ...fragments.map((f, i) => `  [${i}] ${f}`),
            "",
            `Unlock flags: ${unlocked.join(", ") || "(none)"}`,
            "",
            "Tip: Some doors are not doors. Some links are not links."
        ]);
    }

    function close() {
        overlay.classList.add("hidden");
    }

    overlay.querySelector("#diagClose").addEventListener("click", close);

    function toggleDiagnostics() {
        overlay.classList.contains("hidden") ? open() : close();
    }

    // Keybind: Ctrl+Shift+L
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "l")) {
            e.preventDefault();
            toggleDiagnostics();
        }
    });

    window.ConfluxARG = { toggleDiagnostics };
})();