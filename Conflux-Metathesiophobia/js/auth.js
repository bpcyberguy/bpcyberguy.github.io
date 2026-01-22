(() => {
    const STORAGE_KEY = "conflux_session_v1";
    const UNLOCK_KEY = "conflux_unlocks_v1";
    const THEME_KEY = "conflux_theme_v1";

    function getSession() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
        catch { return null; }
    }

    function setSession(sess) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function setTheme(name) {
        localStorage.setItem(THEME_KEY, name);
        const link = document.getElementById("themeStylesheet");
        if (!link) return;
        link.href = name === "diagnostic"
            ? (link.href.includes("/css/") ? "../css/themes/diagnostic.css" : "css/themes/diagnostic.css")
            : (link.href.includes("/css/") ? "../css/themes/metathesiophobia.css" : "css/themes/metathesiophobia.css");
    }

    function applySavedTheme() {
        const name = localStorage.getItem(THEME_KEY) || "metathesiophobia";
        const link = document.getElementById("themeStylesheet");
        if (!link) return;
        // Determine relative path based on current location depth
        const isNested = location.pathname.split("/").filter(Boolean).length > 1;
        link.href = isNested
            ? `../css/themes/${name}.css`
            : `css/themes/${name}.css`;
    }

    async function sha256Hex(str) {
        const enc = new TextEncoder().encode(str);
        const buf = await crypto.subtle.digest("SHA-256", enc);
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }

    async function loginWithId(playerId) {
        applySavedTheme();
        const res = await fetch("data/players.json", { cache: "no-store" });
        const db = await res.json();

        const record = db.players[playerId];
        if (!record) return { ok: false, message: "Unknown ID." };

        setSession({
            playerId,
            name: record.name || "Operator",
            role: "player",
            ts: Date.now()
        });

        return { ok: true, redirectTo: "home/index.html" };
    }

    function requireAuthOrRedirect(loginPath) {
        applySavedTheme();
        const sess = getSession();
        if (!sess || !sess.playerId) {
            location.href = loginPath || "../index.html";
            return null;
        }
        return sess;
    }

    async function elevateToDM(passphrase) {
        const res = await fetch("../data/players.json", { cache: "no-store" });
        const db = await res.json();
        const expected = db.dm?.passphraseHash;
        if (!expected) return false;

        const got = await sha256Hex(passphrase);
        if (got !== expected) return false;

        const sess = getSession();
        if (!sess) return false;
        sess.role = "dm";
        setSession(sess);
        return true;
    }

    function logout() {
        clearSession();
        location.href = location.pathname.includes("/home/") ? "../index.html" : "index.html";
    }

    function getUnlockFlags() {
        try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]"); }
        catch { return []; }
    }

    function setUnlockFlags(flags) {
        localStorage.setItem(UNLOCK_KEY, JSON.stringify([...new Set(flags)]));
    }

    window.ConfluxAuth = {
        getSession,
        loginWithId,
        requireAuthOrRedirect,
        logout,
        setTheme,
        sha256Hex,
        getUnlockFlags,
        setUnlockFlags,
        elevateToDM
    };

    applySavedTheme();
})();