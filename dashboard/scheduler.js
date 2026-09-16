document.addEventListener("DOMContentLoaded", () => {

const scheduleForm =
    document.getElementById("scheduleForm");

const scheduleBot =
    document.getElementById("scheduleBot");

const destinationList =
    document.getElementById("destinationList");

const selectAllDestinationsBtn =
    document.getElementById(
        "selectAllDestinationsBtn"
    );

const clearDestinationsBtn =
    document.getElementById(
        "clearDestinationsBtn"
    );

const destinationCount =
    document.getElementById(
        "destinationCount"
    );

const schedulePost =
    document.getElementById("schedulePost");

const scheduleDate =
    document.getElementById("scheduleDate");

const scheduleTime =
    document.getElementById("scheduleTime");

const scheduleStatus =
    document.getElementById("scheduleStatus");

const resetScheduleBtn =
    document.getElementById(
        "resetScheduleBtn"
    );

const refreshScheduleBtn =
    document.getElementById(
        "refreshScheduleBtn"
    );

const scheduleList =
    document.getElementById(
        "scheduleList"
    );


// =========================================
// DEFAULT TANGGAL
// =========================================

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


scheduleDate.value =
    getToday();


// =========================================
// STATUS DEFAULT
// =========================================

if (scheduleStatus) {

    scheduleStatus.value =
        "scheduled";

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// STATUS INFO
// =========================================

function getStatusInfo(status) {

    const value =
        String(
            status || "scheduled"
        ).toLowerCase();

    const map = {

        scheduled: {
            label: "TERJADWAL",
            className:
                "status-scheduled"
        },

        active: {
            label: "AKTIF",
            className:
                "status-active"
        },

        processing: {
            label: "MENGIRIM",
            className:
                "status-processing"
        },

        completed: {
            label: "BERHASIL",
            className:
                "status-completed"
        },

        failed: {
            label: "GAGAL",
            className:
                "status-failed"
        },

        paused: {
            label: "DIJEDA",
            className:
                "status-paused"
        },

        cancelled: {
            label: "DIBATALKAN",
            className:
                "status-cancelled"
        },

        canceled: {
            label: "DIBATALKAN",
            className:
                "status-cancelled"
        }

    };

    return (
        map[value] || {
            label:
                value.toUpperCase(),

            className:
                "status-default"
        }
    );

}


// =========================================
// FORMAT TANGGAL
// =========================================

function formatScheduleDate(value) {

    if (!value) {
        return "-";
    }

    const normalized =
        String(value)
            .replace(" ", "T");

    const date =
        new Date(normalized);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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


// =========================================
// UPDATE DESTINATION COUNT
// =========================================

function updateDestinationCount() {

    if (!destinationList) {
        return;
    }

    const checked =
        destinationList.querySelectorAll(
            'input[type="checkbox"]:checked'
        );

    const count =
        checked.length;

    if (destinationCount) {

        destinationCount.textContent =
            `${count} destination dipilih`;

    }

}


// =========================================
// GET SELECTED DESTINATIONS
// =========================================

function getSelectedDestinations() {

    if (!destinationList) {
        return [];
    }

    return Array.from(
        destinationList.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    ).map(
        checkbox =>
            Number(
                checkbox.value
            )
    );

}


// =========================================
// SELECT ALL DESTINATIONS
// =========================================

function selectAllDestinations() {

    if (!destinationList) {
        return;
    }

    destinationList
        .querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(
            checkbox => {
                checkbox.checked = true;
            }
        );

    updateDestinationCount();

}


// =========================================
// CLEAR DESTINATIONS
// =========================================

function clearDestinations() {

    if (!destinationList) {
        return;
    }

    destinationList
        .querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(
            checkbox => {
                checkbox.checked = false;
            }
        );

    updateDestinationCount();

}


// =========================================
// LOAD BOTS
// =========================================

async function loadBots() {

    try {

        scheduleBot.innerHTML = `
            <option value="">
                Memuat Bot...
            </option>
        `;

        const response =
            await fetch(
                "/api/bots"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal mengambil data Bot."
            );

        }

        scheduleBot.innerHTML = `
            <option value="">
                Pilih Bot
            </option>
        `;

        const bots =
            result.bots || [];

        if (
            bots.length === 0
        ) {

            scheduleBot.innerHTML = `
                <option value="">
                    Belum ada Bot
                </option>
            `;

            return;

        }

        bots.forEach(
            bot => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    bot.id;

                option.textContent =
                    bot.username
                        ? `${bot.name} (@${bot.username})`
                        : bot.name;

                scheduleBot.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "LOAD BOTS ERROR:",
            error
        );

        scheduleBot.innerHTML = `
            <option value="">
                Gagal memuat Bot
            </option>
        `;

    }

}


// =========================================
// LOAD DESTINATIONS
// =========================================

async function loadDestinations(
    botId
) {

    clearDestinations();

    if (!botId) {

        destinationList.innerHTML = `
            <div class="destination-empty">
                Pilih Bot terlebih dahulu.
            </div>
        `;

        updateDestinationCount();

        return;

    }


    try {

        destinationList.innerHTML = `
            <div class="destination-empty">
                Memuat Destination...
            </div>
        `;

        const response =
            await fetch(
                `/api/destinations?bot_id=${encodeURIComponent(botId)}`
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal mengambil Destination."
            );

        }

        const destinations =
            result.destinations || [];


        destinationList.innerHTML = "";


        if (
            destinations.length === 0
        ) {

            destinationList.innerHTML = `
                <div class="destination-empty">
                    Belum ada Destination untuk Bot ini.
                </div>
            `;

            updateDestinationCount();

            return;

        }


        destinations.forEach(
            destination => {

                const item =
                    document.createElement(
                        "label"
                    );

                item.className =
                    "destination-option";


                item.innerHTML = `

                    <input
                        type="checkbox"
                        value="${destination.id}"
                        class="destination-checkbox"
                    >

                    <span
                        class="destination-check"
                    >
                        ❌“
                    </span>

                    <span
                        class="destination-info"
                    >

                        <strong>
                            ${escapeHtml(
                                destination.name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                destination.type ||
                                "Telegram"
                            )}

                            ${
                                destination.chat_id
                                    ? ` · ${escapeHtml(
                                        destination.chat_id
                                    )}`
                                    : ""
                            }
                        </small>

                    </span>

                `;


                const checkbox =
                    item.querySelector(
                        "input[type='checkbox']"
                    );


                checkbox.addEventListener(
                    "change",
                    updateDestinationCount
                );


                destinationList.appendChild(
                    item
                );

            }
        );


        updateDestinationCount();


    } catch (error) {

        console.error(
            "LOAD DESTINATIONS ERROR:",
            error
        );

        destinationList.innerHTML = `
            <div class="destination-empty error">
                ❌ Gagal memuat Destination.
                <br>
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;

        updateDestinationCount();

    }

}


// =========================================
// LOAD POSTS
// =========================================

async function loadPosts() {

    try {

        schedulePost.innerHTML = `
            <option value="">
                Memuat Post...
            </option>
        `;

        const response =
            await fetch(
                "/api/posts"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal mengambil Post."
            );

        }

        const posts =
            result.posts || [];


        schedulePost.innerHTML = `
            <option value="">
                Pilih Post
            </option>
        `;


        if (
            posts.length === 0
        ) {

            schedulePost.innerHTML = `
                <option value="">
                    Belum ada Post
                </option>
            `;

            return;

        }


        posts.forEach(
            post => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    post.id;

                option.textContent =
                    post.title ||
                    `Post #${post.id}`;

                schedulePost.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "LOAD POSTS ERROR:",
            error
        );

        schedulePost.innerHTML = `
            <option value="">
                Gagal memuat Post
            </option>
        `;

    }

}


// =========================================
// LOAD SCHEDULES
// =========================================

async function loadSchedules() {

    try {

        const response =
            await fetch(
                "/api/schedules"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal mengambil schedule."
            );

        }

        const schedules =
            result.schedules || [];


        if (
            schedules.length === 0
        ) {

            scheduleList.innerHTML = `
                <div class="schedule-empty">

                    <div class="empty-icon">
                        ⏰
                    </div>

                    <h3>
                        Belum ada jadwal
                    </h3>

                    <p>
                        Buat jadwal pertama Anda menggunakan form di atas.
                    </p>

                </div>
            `;

            return;

        }


        scheduleList.innerHTML = "";


        schedules.forEach(
            schedule => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "schedule-item";


                const statusInfo =
                    getStatusInfo(
                        schedule.status
                    );


                const isProcessing =
                    String(
                        schedule.status || ""
                    ).toLowerCase() ===
                    "processing";


                item.innerHTML = `

                    <div class="schedule-main">

                        <div class="schedule-title">

                            ${escapeHtml(
                                schedule.post_title ||
                                "Post"
                            )}

                        </div>


                        <div class="schedule-meta">

                            <span>
                                🤖
                                ${escapeHtml(
                                    schedule.bot_name ||
                                    "-"
                                )}
                            </span>


                            <span>
                                📡
                                ${escapeHtml(
                                    schedule.destination_name ||
                                    "-"
                                )}
                            </span>


                            <span>
                                📅
                                ${formatScheduleDate(
                                    schedule.schedule_time
                                )}
                            </span>

                        </div>

                    </div>


                    <div
                        class="schedule-actions-list"
                    >

                        <span
                            class="schedule-badge ${statusInfo.className}"
                        >
                            ${statusInfo.label}
                        </span>


                        <button
                            type="button"
                            class="btn-delete"
                            data-id="${schedule.id}"
                            ${isProcessing
                                ? "disabled"
                                : ""}
                        >
                            🗑️ Hapus
                        </button>

                    </div>

                `;


                scheduleList.appendChild(
                    item
                );

            }
        );


        // =====================================
        // DELETE BUTTON
        // =====================================

        scheduleList
            .querySelectorAll(
                ".btn-delete"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            if (
                                button.disabled
                            ) {
                                return;
                            }

                            await deleteSchedule(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "LOAD SCHEDULES ERROR:",
            error
        );

        scheduleList.innerHTML = `
            <div class="schedule-empty error">

                ❌ Gagal memuat schedule.

                <br>

                ${escapeHtml(
                    error.message
                )}

            </div>
        `;

    }

}


// =========================================
// DELETE SCHEDULE
// =========================================

async function deleteSchedule(
    id
) {

    const confirmed =
        confirm(
            "Hapus schedule ini?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/schedules/${encodeURIComponent(id)}`,
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
                "Gagal menghapus schedule."
            );

        }


        await loadSchedules();


    } catch (error) {

        console.error(
            "DELETE SCHEDULE ERROR:",
            error
        );

        alert(
            "❌ Gagal menghapus schedule.\n\n" +
            error.message
        );

    }

}


// =========================================
// BOT BERUBAH
// =========================================

scheduleBot.addEventListener(
    "change",
    async () => {

        const botId =
            scheduleBot.value;

        await loadDestinations(
            botId
        );

    }
);


// =========================================
// SELECT ALL
// =========================================

if (
    selectAllDestinationsBtn
) {

    selectAllDestinationsBtn.addEventListener(
        "click",
        selectAllDestinations
    );

}


// =========================================
// CLEAR ALL
// =========================================

if (
    clearDestinationsBtn
) {

    clearDestinationsBtn.addEventListener(
        "click",
        clearDestinations
    );

}


// =========================================
// RESET FORM
// =========================================

function resetForm() {

    scheduleForm.reset();


    scheduleDate.value =
        getToday();


    if (scheduleStatus) {

        scheduleStatus.value =
            "scheduled";

    }


    destinationList.innerHTML = `
        <div class="destination-empty">
            Pilih Bot terlebih dahulu.
        </div>
    `;


    updateDestinationCount();

}


resetScheduleBtn.addEventListener(
    "click",
    resetForm
);


// =========================================
// SAVE SCHEDULE
// =========================================

scheduleForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const botId =
            scheduleBot.value;


        const selectedDestinations =
            getSelectedDestinations();


        const postId =
            schedulePost.value;


        const date =
            scheduleDate.value;


        const time =
            scheduleTime.value;


        // =====================================
        // VALIDASI BOT
        // =====================================

        if (!botId) {

            alert(
                "⚠️ Silakan pilih Bot."
            );

            return;

        }


        // =====================================
        // VALIDASI DESTINATION
        // =====================================

        if (
            selectedDestinations.length === 0
        ) {

            alert(
                "⚠️ Silakan pilih minimal 1 Destination."
            );

            return;

        }


        // =====================================
        // VALIDASI POST
        // =====================================

        if (!postId) {

            alert(
                "⚠️ Silakan pilih Post."
            );

            return;

        }


        // =====================================
        // VALIDASI TANGGAL / WAKTU
        // =====================================

        if (!date || !time) {

            alert(
                "⚠️ Tanggal dan waktu wajib diisi."
            );

            return;

        }


        // =====================================
        // DATETIME
        // =====================================

        const scheduleDateTime =
            new Date(
                `${date}T${time}:00`
            );


        if (
            Number.isNaN(
                scheduleDateTime.getTime()
            )
        ) {

            alert(
                "⚠️ Format tanggal atau waktu tidak valid."
            );

            return;

        }


        // =====================================
        // HARUS FUTURE
        // =====================================

        if (
            scheduleDateTime.getTime() <=
            Date.now()
        ) {

            alert(
                "⚠️ Jadwal harus dibuat untuk waktu yang akan datang."
            );

            return;

        }


        const scheduleTimeValue =
            `${date} ${time}:00`;


        // =====================================
        // BUTTON STATE
        // =====================================

        const submitButton =
            scheduleForm.querySelector(
                'button[type="submit"]'
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "";


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Menyimpan...";

        }


        try {

            let successCount = 0;
            let failedCount = 0;

            const failedDestinations = [];


            // =====================================
            // BUAT SCHEDULE UNTUK SETIAP DESTINATION
            // =====================================

            for (
                const destinationId
                of selectedDestinations
            ) {

                try {

                    const response =
                        await fetch(
                            "/api/schedules",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        bot_id:
                                            Number(
                                                botId
                                            ),

                                        destination_id:
                                            Number(
                                                destinationId
                                            ),

                                        post_id:
                                            Number(
                                                postId
                                            ),

                                        schedule_time:
                                            scheduleTimeValue,

                                        status:
                                            "scheduled"

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
                            "Gagal membuat schedule."
                        );

                    }


                    successCount++;


                } catch (error) {

                    failedCount++;


                    failedDestinations.push(
                        `${destinationId}: ${error.message}`
                    );

                }

            }


            // =====================================
            // HASIL
            // =====================================

            if (
                successCount > 0 &&
                failedCount === 0
            ) {

                alert(
                    `✅ Berhasil membuat ${successCount} schedule.\n\n` +
                    `Post akan dikirim ke ${successCount} destination ` +
                    `pada ${scheduleTimeValue}.`
                );

            } else if (
                successCount > 0 &&
                failedCount > 0
            ) {

                alert(
                    `⚠️ Sebagian schedule berhasil dibuat.\n\n` +
                    `Berhasil : ${successCount}\n` +
                    `Gagal    : ${failedCount}\n\n` +
                    failedDestinations.join("\n")
                );

            } else {

                throw new Error(
                    failedDestinations.join("\n")
                );

            }


            resetForm();


            await loadSchedules();


        } catch (error) {

            console.error(
                "CREATE SCHEDULE ERROR:",
                error
            );

            alert(
                "❌ Gagal membuat schedule.\n\n" +
                error.message
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText;

            }

        }

    }
);


// =========================================
// REFRESH
// =========================================

refreshScheduleBtn.addEventListener(
    "click",
    async () => {

        refreshScheduleBtn.disabled =
            true;


        try {

            await loadBots();

            await loadPosts();


            if (scheduleBot.value) {

                await loadDestinations(
                    scheduleBot.value
                );

            } else {

                destinationList.innerHTML = `
                    <div class="destination-empty">
                        Pilih Bot terlebih dahulu.
                    </div>
                `;

                updateDestinationCount();

            }


            await loadSchedules();


        } finally {

            refreshScheduleBtn.disabled =
                false;

        }

    }
);


// =========================================
// AUTO REFRESH
// =========================================

setInterval(
    () => {

        loadSchedules();

    },
    5000
);


// =========================================
// INITIAL LOAD
// =========================================

Promise.all([
    loadBots(),
    loadPosts(),
    loadSchedules()
]);


console.log(
    "Telegram Auto Poster - Scheduler Multi Destination loaded."
);

});
