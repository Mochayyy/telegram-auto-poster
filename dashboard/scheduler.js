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
// BULK SCHEDULER - DEFAULT TANGGAL
// =========================================

const scheduleStartDate =
    document.getElementById("scheduleStartDate");

const scheduleEndDate =
    document.getElementById("scheduleEndDate");

const scheduleTimes =
    document.getElementById("scheduleTimes");

const addScheduleTimeBtn =
    document.getElementById("addScheduleTimeBtn");

const previewDays =
    document.getElementById("previewDays");

const previewTimes =
    document.getElementById("previewTimes");

const previewDestinations =
    document.getElementById("previewDestinations");

const previewTotal =
    document.getElementById("previewTotal");


// =========================================
// DEFAULT DATE
// =========================================

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


if (scheduleStartDate) {

    scheduleStartDate.value =
        getToday();

}


if (scheduleEndDate) {

    scheduleEndDate.value =
        getToday();

}


// =========================================
// STATUS DEFAULT
// =========================================

if (scheduleStatus) {

    scheduleStatus.value =
        "scheduled";

}


// =========================================
// GET SELECTED WEEKDAYS
// =========================================

function getSelectedWeekdays() {

    return Array.from(
        document.querySelectorAll(
            'input[name="scheduleWeekday"]:checked'
        )
    ).map(
        checkbox =>
            Number(checkbox.value)
    );

}


// =========================================
// GET SELECTED TIMES
// =========================================

function getScheduleTimes() {

    if (!scheduleTimes) {
        return [];
    }

    return Array.from(
        scheduleTimes.querySelectorAll(
            ".schedule-time-input"
        )
    )
        .map(
            input =>
                input.value
        )
        .filter(Boolean);

}


// =========================================
// ADD JAM
// =========================================

function addScheduleTime() {

    if (!scheduleTimes) {
        return;
    }

    const row =
        document.createElement("div");

    row.className =
        "schedule-time-row";

    row.innerHTML = `
        <input
            type="time"
            class="schedule-time-input"
            value="20:00"
        >

        <button
            type="button"
            class="btn-secondary btn-small remove-time-btn"
        >
            ✕
        </button>
    `;

    scheduleTimes.appendChild(row);

    updateSchedulePreview();

}


if (addScheduleTimeBtn) {

    addScheduleTimeBtn.addEventListener(
        "click",
        addScheduleTime
    );

}


// =========================================
// HAPUS JAM
// =========================================

if (scheduleTimes) {

    scheduleTimes.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".remove-time-btn"
                );

            if (!button) {
                return;
            }

            const rows =
                scheduleTimes.querySelectorAll(
                    ".schedule-time-row"
                );

            // Minimal 1 jam harus tetap ada
            if (rows.length <= 1) {

                alert(
                    "⚠️ Minimal harus ada 1 jam posting."
                );

                return;
            }

            button
                .closest(".schedule-time-row")
                .remove();

            updateSchedulePreview();

        }
    );

}


// =========================================
// HITUNG HARI AKTIF
// =========================================

function countActiveDays(
    startDate,
    endDate,
    weekdays
) {

    if (!startDate || !endDate) {
        return 0;
    }

    const start =
        new Date(
            `${startDate}T00:00:00`
        );

    const end =
        new Date(
            `${endDate}T00:00:00`
        );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
    ) {
        return 0;
    }

    let count = 0;

    const current =
        new Date(start);

    while (current <= end) {

        if (
            weekdays.includes(
                current.getDay()
            )
        ) {
            count++;
        }

        current.setDate(
            current.getDate() + 1
        );

    }

    return count;

}


// =========================================
// PREVIEW
// =========================================

function updateSchedulePreview() {

    const startDate =
        scheduleStartDate
            ? scheduleStartDate.value
            : "";

    const endDate =
        scheduleEndDate
            ? scheduleEndDate.value
            : "";

    const weekdays =
        getSelectedWeekdays();

    const times =
        getScheduleTimes();

    const destinations =
        getSelectedDestinations();

    const activeDays =
        countActiveDays(
            startDate,
            endDate,
            weekdays
        );

    const total =
        activeDays *
        times.length *
        destinations.length;


    if (previewDays) {

        previewDays.textContent =
            activeDays;

    }


    if (previewTimes) {

        previewTimes.textContent =
            times.length;

    }


    if (previewDestinations) {

        previewDestinations.textContent =
            destinations.length;

    }


    if (previewTotal) {

        previewTotal.textContent =
            total;

    }

}


// =========================================
// PREVIEW EVENTS
// =========================================

if (scheduleStartDate) {

    scheduleStartDate.addEventListener(
        "change",
        updateSchedulePreview
    );

}


if (scheduleEndDate) {

    scheduleEndDate.addEventListener(
        "change",
        updateSchedulePreview
    );

}


document.addEventListener(
    "change",
    event => {

        if (
            event.target.matches(
                'input[name="scheduleWeekday"]'
            )
        ) {

            updateSchedulePreview();

        }

        if (
            event.target.matches(
                ".schedule-time-input"
            )
        ) {

            updateSchedulePreview();

        }

    }
  );

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


    // =====================================
    // DEFAULT TANGGAL
    // =====================================

    const today =
        getToday();


    if (scheduleStartDate) {

        scheduleStartDate.value =
            today;

    }


    if (scheduleEndDate) {

        scheduleEndDate.value =
            today;

    }


    // =====================================
    // DEFAULT HARI
    // =====================================

    document
        .querySelectorAll(
            'input[name="scheduleWeekday"]'
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    true;

            }
        );


    // =====================================
    // DEFAULT JAM
    // =====================================

    if (scheduleTimes) {

        scheduleTimes.innerHTML = `

            <div class="schedule-time-row">

                <input
                    type="time"
                    class="schedule-time-input"
                    value="08:00"
                >

                <button
                    type="button"
                    class="btn-secondary btn-small remove-time-btn"
                >
                    ✕
                </button>

            </div>


            <div class="schedule-time-row">

                <input
                    type="time"
                    class="schedule-time-input"
                    value="12:00"
                >

                <button
                    type="button"
                    class="btn-secondary btn-small remove-time-btn"
                >
                    ✕
                </button>

            </div>

        `;

    }


    // =====================================
    // STATUS
    // =====================================

    if (scheduleStatus) {

        scheduleStatus.value =
            "scheduled";

    }


    // =====================================
    // DESTINATION
    // =====================================

    destinationList.innerHTML = `

        <div class="destination-empty">

            Pilih Bot terlebih dahulu.

        </div>

    `;


    updateDestinationCount();

    updateSchedulePreview();

}


resetScheduleBtn.addEventListener(
    "click",
    resetForm
);


// =========================================
// SAVE BULK SCHEDULE
// =========================================

scheduleForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        // =====================================
        // DATA FORM
        // =====================================

        const botId =
            scheduleBot.value;


        const selectedDestinations =
            getSelectedDestinations();


        const postId =
            schedulePost.value;


        const startDate =
            scheduleStartDate
                ? scheduleStartDate.value
                : "";


        const endDate =
            scheduleEndDate
                ? scheduleEndDate.value
                : "";


        const selectedWeekdays =
            getSelectedWeekdays();


        // =====================================
        // AMBIL SEMUA JAM
        // =====================================

        const rawTimes =
            getScheduleTimes();


        // Hapus jam kosong + duplikat
        const selectedTimes =
            [
                ...new Set(
                    rawTimes
                        .filter(Boolean)
                )
            ]
                .sort();


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
        // VALIDASI TANGGAL
        // =====================================

        if (
            !startDate ||
            !endDate
        ) {

            alert(
                "⚠️ Tanggal mulai dan tanggal selesai wajib diisi."
            );

            return;

        }


        const start =
            new Date(
                `${startDate}T00:00:00`
            );


        const end =
            new Date(
                `${endDate}T00:00:00`
            );


        if (
            Number.isNaN(
                start.getTime()
            ) ||
            Number.isNaN(
                end.getTime()
            )
        ) {

            alert(
                "⚠️ Format tanggal tidak valid."
            );

            return;

        }


        if (start > end) {

            alert(
                "⚠️ Tanggal mulai tidak boleh lebih besar dari tanggal selesai."
            );

            return;

        }


        // =====================================
        // VALIDASI HARI
        // =====================================

        if (
            selectedWeekdays.length === 0
        ) {

            alert(
                "⚠️ Silakan pilih minimal 1 hari posting."
            );

            return;

        }


        // =====================================
        // VALIDASI JAM
        // =====================================

        if (
            selectedTimes.length === 0
        ) {

            alert(
                "⚠️ Silakan masukkan minimal 1 jam posting."
            );

            return;

        }


        // =====================================
        // GENERATE SEMUA DATETIME
        // =====================================

        const schedulesToCreate = [];


        const current =
            new Date(start);


        while (
            current <= end
        ) {

            const weekday =
                current.getDay();


            if (
                selectedWeekdays.includes(
                    weekday
                )
            ) {

                const year =
                    current.getFullYear();


                const month =
                    String(
                        current.getMonth() + 1
                    )
                        .padStart(2, "0");


                const day =
                    String(
                        current.getDate()
                    )
                        .padStart(2, "0");


                const dateString =
                    `${year}-${month}-${day}`;


                for (
                    const time
                    of selectedTimes
                ) {

                    const scheduleDateTime =
                        new Date(
                            `${dateString}T${time}:00`
                        );


                    if (
                        Number.isNaN(
                            scheduleDateTime.getTime()
                        )
                    ) {

                        continue;

                    }


                    // =================================
                    // HANYA JADWAL FUTURE
                    // =================================

                    if (
                        scheduleDateTime.getTime() <=
                        Date.now()
                    ) {

                        continue;

                    }


                    for (
                        const destinationId
                        of selectedDestinations
                    ) {

                        schedulesToCreate.push({

                            bot_id:
                                Number(botId),

                            destination_id:
                                Number(
                                    destinationId
                                ),

                            post_id:
                                Number(postId),

                            schedule_time:
                                `${dateString} ${time}:00`,

                            status:
                                "scheduled"

                        });

                    }

                }

            }


            current.setDate(
                current.getDate() + 1
            );

        }


        // =====================================
        // TIDAK ADA JADWAL VALID
        // =====================================

        if (
            schedulesToCreate.length === 0
        ) {

            alert(
                "⚠️ Tidak ada jadwal yang valid.\n\n" +
                "Pastikan tanggal, hari, dan jam posting " +
                "masih berada di masa depan."
            );

            return;

        }


        // =====================================
        // CONFIRM
        // =====================================

        const confirmed =
            confirm(

                "🚀 BUAT SEMUA JADWAL?\n\n" +

                `📅 Mulai     : ${startDate}\n` +
                `📅 Selesai   : ${endDate}\n` +
                `📆 Hari      : ${selectedWeekdays.length}\n` +
                `⏰ Jam       : ${selectedTimes.length}\n` +
                `📡 Destination: ${selectedDestinations.length}\n\n` +

                `📊 Total schedule: ${schedulesToCreate.length}\n\n` +

                "Lanjutkan membuat semua schedule?"

            );


        if (!confirmed) {

            return;

        }


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
                "Membuat Jadwal...";

        }


        try {

            let successCount = 0;

            let failedCount = 0;

            const failedSchedules = [];


            // =====================================
            // CREATE SCHEDULE
            // BATCH KECIL AGAR BROWSER AMAN
            // =====================================

            const batchSize = 10;


            for (
                let i = 0;
                i < schedulesToCreate.length;
                i += batchSize
            ) {

                const batch =
                    schedulesToCreate.slice(
                        i,
                        i + batchSize
                    );


                const results =
                    await Promise.all(

                        batch.map(
                            async schedule => {

                                try {

                                    const response =
                                        await fetch(
                                            "/api/schedules",
                                            {
                                                method:
                                                    "POST",

                                                headers: {
                                                    "Content-Type":
                                                        "application/json"
                                                },

                                                body:
                                                    JSON.stringify(
                                                        schedule
                                                    )

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


                                    return {
                                        success: true
                                    };


                                } catch (error) {

                                    return {

                                        success:
                                            false,

                                        error:
                                            error.message,

                                        schedule:
                                            schedule

                                    };

                                }

                            }
                        )

                    );


                results.forEach(
                    result => {

                        if (
                            result.success
                        ) {

                            successCount++;

                        } else {

                            failedCount++;

                            failedSchedules.push(

                                `${result.schedule.schedule_time} → ` +
                                `${result.error}`

                            );

                        }

                    }
                );


                // Progress button
                if (submitButton) {

                    submitButton.textContent =
                        `Menyimpan ${Math.min(
                            i + batchSize,
                            schedulesToCreate.length
                        )}/${schedulesToCreate.length}...`;

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

                    `📅 Periode : ${startDate} → ${endDate}\n` +
                    `📆 Hari    : ${selectedWeekdays.length}\n` +
                    `⏰ Jam     : ${selectedTimes.length}\n` +
                    `📡 Destination : ${selectedDestinations.length}\n\n` +

                    "Scheduler Railway akan menjalankan " +
                    "jadwal secara otomatis."

                );

            } else if (
                successCount > 0 &&
                failedCount > 0
            ) {

                alert(

                    `⚠️ Sebagian schedule berhasil dibuat.\n\n` +

                    `Berhasil : ${successCount}\n` +
                    `Gagal    : ${failedCount}\n\n` +

                    failedSchedules
                        .slice(0, 20)
                        .join("\n")

                );

            } else {

                throw new Error(
                    failedSchedules
                        .slice(0, 20)
                        .join("\n")
                );

            }


            // =====================================
            // RESET + REFRESH
            // =====================================

            resetForm();

            await loadSchedules();


        } catch (error) {

            console.error(
                "CREATE BULK SCHEDULE ERROR:",
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
