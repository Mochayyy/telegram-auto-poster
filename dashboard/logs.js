document.addEventListener("DOMContentLoaded", () => {

    const logsList =
        document.getElementById("logsList");

    const refreshLogsBtn =
        document.getElementById("refreshLogsBtn");


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        const date = new Date(
            value.replace(" ", "T")
        );

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function getStatusClass(status) {

        const value =
            String(status || "").toLowerCase();

        if (
            value === "success" ||
            value === "completed"
        ) {
            return "log-success";
        }

        return "log-failed";
    }


    async function loadLogs() {

        try {

            logsList.innerHTML = `
                <div class="empty-logs">
                    Memuat logs...
                </div>
            `;


            const response =
                await fetch("/api/logs");


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Gagal mengambil logs."
                );
            }


            const logs =
                result.logs || [];


            if (!logs.length) {

                logsList.innerHTML = `
                    <div class="empty-logs">
                        Belum ada aktivitas.
                    </div>
                `;

                return;
            }


            logsList.innerHTML = "";


            logs.forEach(log => {

                const item =
                    document.createElement("div");

                item.className =
                    "log-item";


                item.innerHTML = `

                    <div class="log-info">

                        <div class="log-title">
                            ${escapeHtml(
                                log.post_title ||
                                "Post"
                            )}
                        </div>

                        <div class="log-meta">

                            <span>
                                🤖
                                ${escapeHtml(
                                    log.bot_name || "-"
                                )}
                            </span>

                            <span>
                                📡
                                ${escapeHtml(
                                    log.destination_name || "-"
                                )}
                            </span>

                            <span>
                                🕒
                                ${formatDate(
                                    log.created_at
                                )}
                            </span>

                        </div>

                        <div class="log-message">
                            ${escapeHtml(
                                log.message || "-"
                            )}
                        </div>

                    </div>


                    <span
                        class="log-status ${getStatusClass(
                            log.status
                        )}"
                    >
                        ${escapeHtml(
                            log.status || "-"
                        )}
                    </span>

                `;


                logsList.appendChild(item);

            });


        } catch (error) {

            console.error(
                "LOAD LOGS ERROR:",
                error
            );


            logsList.innerHTML = `

                <div class="empty-logs">

                    ❌ Gagal memuat logs.

                    <br>

                    ${escapeHtml(
                        error.message
                    )}

                </div>

            `;

        }

    }


    refreshLogsBtn.addEventListener(
        "click",
        loadLogs
    );


    loadLogs();

});
