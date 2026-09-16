document.addEventListener("DOMContentLoaded", () => {

    const destinationForm = document.getElementById("destinationForm");

    const destinationBot = document.getElementById("destinationBot");
    const destinationName = document.getElementById("destinationName");
    const destinationChatId = document.getElementById("destinationChatId");
    const destinationType = document.getElementById("destinationType");

    const saveDestinationBtn = document.getElementById("saveDestinationBtn");
    const resetDestinationBtn = document.getElementById("resetDestinationBtn");
    const refreshDestinationsBtn = document.getElementById("refreshDestinationsBtn");

    const destinationsList = document.getElementById("destinationsList");
    const destinationCount = document.getElementById("destinationCount");


    /* =========================
       LOAD BOTS
    ========================= */

    async function loadBots() {

        destinationBot.innerHTML = `
            <option value="">Memuat bot...</option>
        `;

        try {

            const response = await fetch("/api/bots");
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal mengambil daftar bot."
                );
            }

            destinationBot.innerHTML = `
                <option value="">Pilih Bot</option>
            `;

            if (!result.bots || result.bots.length === 0) {

                destinationBot.innerHTML = `
                    <option value="">
                        Belum ada bot
                    </option>
                `;

                return;
            }

            result.bots.forEach(bot => {

                const option = document.createElement("option");

                option.value = bot.id;

                option.textContent =
                    `${bot.name}${bot.username ? " (" + bot.username + ")" : ""}`;

                destinationBot.appendChild(option);

            });

        } catch (error) {

            console.error("LOAD BOTS ERROR:", error);

            destinationBot.innerHTML = `
                <option value="">
                    Gagal memuat bot
                </option>
            `;

        }

    }


    /* =========================
       LOAD DESTINATIONS
    ========================= */

    async function loadDestinations() {

        destinationsList.innerHTML = `
            <div class="destination-loading">

                <strong>Memuat destination...</strong>

                <span>
                    Mengambil data dari database.
                </span>

            </div>
        `;

        try {

            const response = await fetch("/api/destinations");
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal mengambil destination."
                );
            }

            const destinations = result.destinations || [];

            destinationCount.textContent =
                `${destinations.length} Destination`;


            if (destinations.length === 0) {

                destinationsList.innerHTML = `
                    <div class="destination-empty">

                        <div class="empty-icon">
                            🎯
                        </div>

                        <strong>
                            Belum ada destination
                        </strong>

                        <span>
                            Tambahkan group atau channel
                            menggunakan form di atas.
                        </span>

                    </div>
                `;

                return;
            }


            destinationsList.innerHTML = "";


            destinations.forEach(destination => {

                const card = document.createElement("div");

                card.className = "destination-card";


                const icon =
                    destination.type === "channel"
                        ? "📢"
                        : "👥";


                const typeLabel =
                    destination.type === "channel"
                        ? "Channel"
                        : "Group";


                const statusClass =
                    destination.status === "active"
                        ? ""
                        : "inactive";


                const statusLabel =
                    destination.status === "active"
                        ? "Active"
                        : "Inactive";


                card.innerHTML = `

                    <div class="destination-icon">
                        ${icon}
                    </div>


                    <div class="destination-info">

                        <strong>
                            ${escapeHtml(destination.name)}
                        </strong>

                        <span>
                            Bot ID: ${escapeHtml(String(destination.bot_id))}
                        </span>


                        <div class="destination-meta">

                            <span class="destination-type">
                                ${typeLabel}
                            </span>

                            <span class="destination-chat-id">
                                ${escapeHtml(String(destination.chat_id))}
                            </span>

                        </div>

                    </div>


                    <div class="destination-status ${statusClass}">
                        ${statusLabel}
                    </div>


                    <div class="destination-actions">

                    <button
                        class="destination-test"
                        onclick="testDestination(${destination.id})"
                    >
                        🚀 Test Send
                    </button>

                    <button
                        class="destination-delete"
                        onclick="deleteDestination(${destination.id})"
                    >
                        🗑 Hapus
                    </button>

                    </div>

                `;


                destinationsList.appendChild(card);

            });

        } catch (error) {

            console.error(
                "LOAD DESTINATIONS ERROR:",
                error
            );

            destinationCount.textContent =
                "0 Destination";


            destinationsList.innerHTML = `

                <div class="destination-error">

                    <strong>
                        Gagal memuat destination
                    </strong>

                    <span>
                        ${escapeHtml(error.message)}
                    </span>

                </div>

            `;

        }

    }


    /* =========================
       RESET FORM
    ========================= */

    function resetForm() {

        destinationForm.reset();

        destinationBot.value = "";
        destinationType.value = "";

        destinationName.focus();

    }


    /* =========================
       CREATE DESTINATION
    ========================= */

    destinationForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const botId =
                Number(destinationBot.value);

            const name =
                destinationName.value.trim();

            const chatId =
                destinationChatId.value.trim();

            const type =
                destinationType.value;


            if (!botId) {

                alert("⚠️ Silakan pilih bot.");

                destinationBot.focus();

                return;

            }


            if (!name) {

                alert(
                    "⚠️ Nama destination wajib diisi."
                );

                destinationName.focus();

                return;

            }


            if (!chatId) {

                alert(
                    "⚠️ Chat ID wajib diisi."
                );

                destinationChatId.focus();

                return;

            }


            if (!type) {

                alert(
                    "⚠️ Silakan pilih tipe destination."
                );

                destinationType.focus();

                return;

            }


            saveDestinationBtn.disabled = true;

            saveDestinationBtn.textContent =
                "⏳ Menyimpan...";


            try {

                const response = await fetch(
                    "/api/destinations",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            bot_id: botId,

                            name: name,

                            chat_id: chatId,

                            type: type

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
                        "Gagal menambahkan destination."
                    );

                }


                alert(
                    "✅ Destination berhasil ditambahkan."
                );


                resetForm();

                await loadDestinations();


            } catch (error) {

                console.error(
                    "CREATE DESTINATION ERROR:",
                    error
                );

                alert(
                    "❌ Gagal menambahkan destination.\n\n" +
                    error.message
                );

            } finally {

                saveDestinationBtn.disabled = false;

                saveDestinationBtn.textContent =
                    "➕ Tambah Destination";

            }

        }
    );


    /* =========================
       DELETE DESTINATION
    ========================= */

    window.deleteDestination = async function (id) {

        const confirmed = confirm(
            "Apakah Anda yakin ingin menghapus destination ini?"
        );


        if (!confirmed) {
            return;
        }


        try {

            const response = await fetch(
                `/api/destinations/${id}`,
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
                    "Gagal menghapus destination."
                );

            }


            alert(
                "✅ Destination berhasil dihapus."
            );


            await loadDestinations();


        } catch (error) {

            console.error(
                "DELETE DESTINATION ERROR:",
                error
            );

            alert(
                "❌ Gagal menghapus destination.\n\n" +
                error.message
            );

        }

  };

    window.testDestination = async function (id) {

        const confirmed = confirm(
            "Kirim pesan TEST ke destination ini?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `/api/destinations/${id}/test`,
                {
                    method: "POST"
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Gagal mengirim test message."
                );
            }

            alert(
                "✅ TEST BERHASIL!\n\n" +
                "Pesan sudah dikirim ke Telegram."
            );

        } catch (error) {

            console.error(
                "TEST DESTINATION ERROR:",
                error
            );

            alert(
                "❌ TEST GAGAL\n\n" +
                error.message
            );
        }
    };


    /* =========================
       BUTTON EVENTS
    ========================= */

    resetDestinationBtn.addEventListener(
        "click",
        resetForm
    );


    refreshDestinationsBtn.addEventListener(
        "click",
        async () => {

            refreshDestinationsBtn.disabled = true;

            refreshDestinationsBtn.textContent =
                "⏳ Loading...";


            await Promise.all([
                loadBots(),
                loadDestinations()
            ]);


            refreshDestinationsBtn.disabled = false;

            refreshDestinationsBtn.textContent =
                "🔄 Refresh";

        }
    );


    /* =========================
       ESCAPE HTML
    ========================= */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================
       INITIAL LOAD
    ========================= */

    loadBots();
    loadDestinations();

});
