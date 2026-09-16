document.addEventListener("DOMContentLoaded", () => {

    const botForm =
        document.getElementById("botForm");

    const botName =
        document.getElementById("botName");

    const botUsername =
        document.getElementById("botUsername");

    const botToken =
        document.getElementById("botToken");

    const botsList =
        document.getElementById("botsList");

    const botCount =
        document.getElementById("botCount");

    const refreshBotsBtn =
        document.getElementById("refreshBotsBtn");

    const resetBotBtn =
        document.getElementById("resetBotBtn");


    /* ========================================
       LOAD BOTS
    ======================================== */

    async function loadBots() {

        try {

            botsList.innerHTML = `
                <div class="bot-empty">
                    <div class="bot-empty-icon">⏳</div>
                    <h3>Memuat bot...</h3>
                    <p>Mohon tunggu sebentar.</p>
                </div>
            `;


            const response =
                await fetch("/api/bots");


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Gagal mengambil daftar bot."
                );
            }


            const bots =
                result.bots || [];


            botCount.textContent =
                `${bots.length} Bot`;


            if (bots.length === 0) {

                botsList.innerHTML = `
                    <div class="bot-empty">

                        <div class="bot-empty-icon">
                            🤖
                        </div>

                        <h3>
                            Belum ada bot
                        </h3>

                        <p>
                            Tambahkan bot Telegram untuk mulai menggunakan Auto Poster.
                        </p>

                    </div>
                `;

                return;
            }


            botsList.innerHTML =
                bots.map(bot => {

                    const status =
                        String(
                            bot.status || "inactive"
                        ).toLowerCase();


                    const statusText =
                        status === "active"
                            ? "Active"
                            : "Inactive";


                    return `
                        <div class="bot-card">

                            <div class="bot-icon">
                                🤖
                            </div>


                            <div class="bot-info">

                                <strong>
                                    ${escapeHtml(
                                        bot.name || "Unnamed Bot"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        bot.username || "No username"
                                    )}
                                </span>

                                <div class="bot-meta">
                                    ID: ${escapeHtml(
                                        String(bot.id)
                                    )}
                                </div>

                            </div>


                            <div class="bot-status ${status === "active" ? "active" : "inactive"}">
                                ${statusText}
                            </div>


                            <button
                                type="button"
                                class="bot-delete"
                                title="Hapus bot"
                                onclick="deleteBot(${Number(bot.id)})"
                            >
                                🗑️
                            </button>

                        </div>
                    `;

                }).join("");


        } catch (error) {

            console.error(
                "LOAD BOTS ERROR:",
                error
            );


            botsList.innerHTML = `
                <div class="bot-empty">

                    <div class="bot-empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Gagal memuat bot
                    </h3>

                    <p>
                        ${escapeHtml(error.message)}
                    </p>

                </div>
            `;

        }

    }


    /* ========================================
       ADD BOT
    ======================================== */

    botForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                botName.value.trim();

            const username =
                botUsername.value.trim();

            const token =
                botToken.value.trim();


            if (!name) {

                alert(
                    "❌ Nama bot wajib diisi."
                );

                botName.focus();

                return;
            }


            if (!token) {

                alert(
                    "❌ Bot token wajib diisi."
                );

                botToken.focus();

                return;
            }


            const saveButton =
                document.getElementById(
                    "saveBotBtn"
                );


            const originalText =
                saveButton.textContent;


            try {

                saveButton.disabled = true;

                saveButton.textContent =
                    "⏳ Memvalidasi...";


                const response =
                    await fetch(
                        "/api/bots",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                username,
                                token
                            })
                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Gagal menambahkan bot."
                    );
                }


                alert(
                    "✅ Bot berhasil ditambahkan."
                );


                botForm.reset();


                await loadBots();


            } catch (error) {

                console.error(
                    "ADD BOT ERROR:",
                    error
                );


                alert(
                    "❌ Gagal menambahkan bot.\n\n" +
                    error.message
                );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    originalText;

            }

        }
    );


    /* ========================================
       DELETE BOT
    ======================================== */

    window.deleteBot =
        async function (id) {

            const confirmed =
                confirm(
                    "Hapus bot ini dari sistem?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `/api/bots/${id}`,
                        {
                            method: "DELETE"
                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Gagal menghapus bot."
                    );
                }


                alert(
                    "✅ Bot berhasil dihapus."
                );


                await loadBots();


            } catch (error) {

                console.error(
                    "DELETE BOT ERROR:",
                    error
                );


                alert(
                    "❌ Gagal menghapus bot.\n\n" +
                    error.message
                );

            }

        };


    /* ========================================
       EVENTS
    ======================================== */

    refreshBotsBtn.addEventListener(
        "click",
        loadBots
    );


    resetBotBtn.addEventListener(
        "click",
        () => {
            botForm.reset();
        }
    );


    /* ========================================
       SECURITY
    ======================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* ========================================
       INITIAL LOAD
    ======================================== */

    loadBots();

});
