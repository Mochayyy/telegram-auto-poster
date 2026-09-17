document.addEventListener("DOMContentLoaded", () => {

    const logsList =
        document.getElementById("logsList");

    const refreshLogsBtn =
        document.getElementById("refreshLogsBtn");

    let allLogs = [];


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

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


    // =====================================================
    // STATUS CLASS
    // =====================================================

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


    // =====================================================
    // BUILD FILTER OPTIONS
    // =====================================================

    function populateFilters() {

        const statusFilter =
            document.getElementById("logStatusFilter");

        const botFilter =
            document.getElementById("logBotFilter");

        const destinationFilter =
            document.getElementById(
                "logDestinationFilter"
            );

        const postFilter =
            document.getElementById("logPostFilter");


        if (!statusFilter) {
            return;
        }


        const bots =
            [
                ...new Map(
                    allLogs
                        .map(log => [
                            String(
                                log.bot_name || "-"
                            ),
                            log.bot_name || "-"
                        ])
                ).values()
            ]
                .sort();


        const destinations =
            [
                ...new Map(
                    allLogs
                        .map(log => [
                            String(
                                log.destination_name || "-"
                            ),
                            log.destination_name || "-"
                        ])
                ).values()
            ]
                .sort();


        const posts =
            [
                ...new Map(
                    allLogs
                        .map(log => [
                            String(
                                log.post_title || "-"
                            ),
                            log.post_title || "-"
                        ])
                ).values()
            ]
                .sort();


        statusFilter.innerHTML = `
            <option value="">Semua Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
        `;


        botFilter.innerHTML = `
            <option value="">Semua Bot</option>
            ${bots.map(bot => `
                <option value="${escapeHtml(bot)}">
                    ${escapeHtml(bot)}
                </option>
            `).join("")}
        `;


        destinationFilter.innerHTML = `
            <option value="">Semua Destination</option>
            ${destinations.map(destination => `
                <option value="${escapeHtml(destination)}">
                    ${escapeHtml(destination)}
                </option>
            `).join("")}
        `;


        postFilter.innerHTML = `
            <option value="">Semua Post</option>
            ${posts.map(post => `
                <option value="${escapeHtml(post)}">
                    ${escapeHtml(post)}
                </option>
            `).join("")}
        `;
    }


    // =====================================================
    // FILTER LOGS
    // =====================================================

    function filterLogs() {

        const status =
            document.getElementById(
                "logStatusFilter"
            )?.value || "";


        const bot =
            document.getElementById(
                "logBotFilter"
            )?.value || "";


        const destination =
            document.getElementById(
                "logDestinationFilter"
            )?.value || "";


        const post =
            document.getElementById(
                "logPostFilter"
            )?.value || "";


        const search =
            (
                document.getElementById(
                    "logSearch"
                )?.value || ""
            )
                .trim()
                .toLowerCase();


        const filtered =
            allLogs.filter(log => {

                const logStatus =
                    String(
                        log.status || ""
                    )
                        .toLowerCase();


                const logBot =
                    String(
                        log.bot_name || "-"
                    );


                const logDestination =
                    String(
                        log.destination_name || "-"
                    );


                const logPost =
                    String(
                        log.post_title || "-"
                    );


                const logMessage =
                    String(
                        log.message || ""
                    );


                if (
                    status &&
                    logStatus !== status
                ) {
                    return false;
                }


                if (
                    bot &&
                    logBot !== bot
                ) {
                    return false;
                }


                if (
                    destination &&
                    logDestination !== destination
                ) {
                    return false;
                }


                if (
                    post &&
                    logPost !== post
                ) {
                    return false;
                }


                if (
                    search &&
                    !(
                        logPost
                            .toLowerCase()
                            .includes(search) ||

                        logMessage
                            .toLowerCase()
                            .includes(search) ||

                        logBot
                            .toLowerCase()
                            .includes(search) ||

                        logDestination
                            .toLowerCase()
                            .includes(search)
                    )
                ) {
                    return false;
                }


                return true;

            });


        renderLogs(filtered);
    }


    // =====================================================
    // RENDER LOGS
    // =====================================================

    function renderLogs(logs) {

        if (!logs.length) {

            logsList.innerHTML = `
                <div class="empty-logs">
                    Tidak ada log yang sesuai dengan filter.
                </div>
            `;

            updateLogCount(0);

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


        updateLogCount(logs.length);
    }


    // =====================================================
    // LOG COUNT
    // =====================================================

    function updateLogCount(count) {

        const counter =
            document.getElementById(
                "logResultCount"
            );

        if (!counter) {
            return;
        }

        counter.textContent =
            `${count} log`;
    }


    // =====================================================
    // RESET FILTER
    // =====================================================

    function resetFilters() {

        const ids = [
            "logStatusFilter",
            "logBotFilter",
            "logDestinationFilter",
            "logPostFilter"
        ];


        ids.forEach(id => {

            const element =
                document.getElementById(id);

            if (element) {
                element.value = "";
            }

        });


        const search =
            document.getElementById(
                "logSearch"
            );

        if (search) {
            search.value = "";
        }


        filterLogs();
    }


    // =====================================================
    // LOAD LOGS
    // =====================================================

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


            allLogs =
                result.logs || [];


            populateFilters();

            filterLogs();


            if (!allLogs.length) {

                logsList.innerHTML = `
                    <div class="empty-logs">
                        Belum ada aktivitas.
                    </div>
                `;

                updateLogCount(0);
            }


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


    // =====================================================
    // FILTER EVENTS
    // =====================================================

    [
        "logStatusFilter",
        "logBotFilter",
        "logDestinationFilter",
        "logPostFilter"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.addEventListener(
                "change",
                filterLogs
            );

        }

    });


    const searchInput =
        document.getElementById(
            "logSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterLogs
        );

    }


    const resetButton =
        document.getElementById(
            "resetLogFiltersBtn"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    // =====================================================
    // REFRESH
    // =====================================================

    refreshLogsBtn.addEventListener(
        "click",
        loadLogs
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadLogs();

});
