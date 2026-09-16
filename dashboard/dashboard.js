document.addEventListener("DOMContentLoaded", () => {

    const totalBots =
        document.getElementById("totalBots");

    const totalDestinations =
        document.getElementById("totalDestinations");

    const activeSchedules =
        document.getElementById("activeSchedules");

    const successfulLogs =
        document.getElementById("successfulLogs");


    async function loadDashboard() {

        try {

            const response =
                await fetch("/api/dashboard");

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Gagal mengambil data Dashboard."
                );
            }


            const stats = result.stats;


            if (totalBots) {
                totalBots.textContent =
                    stats.total_bots ?? 0;
            }


            if (totalDestinations) {
                totalDestinations.textContent =
                    stats.total_destinations ?? 0;
            }


            if (activeSchedules) {
                activeSchedules.textContent =
                    stats.active_schedules ?? 0;
            }


            if (successfulLogs) {
                successfulLogs.textContent =
                    stats.successful_logs ?? 0;
            }


        } catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );

        }

  }

  const upcomingScheduleList =
      document.getElementById("upcomingScheduleList");


  async function loadUpcomingSchedules() {

      if (!upcomingScheduleList) {
          return;
      }

      try {

          const response =
              await fetch("/api/schedules");

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


          if (schedules.length === 0) {

              upcomingScheduleList.innerHTML = `
                  <div class="empty">

                      <div class="empty-icon">📅</div>

                      <h3>Belum ada schedule</h3>

                      <p>
                          Schedule posting yang dibuat akan muncul di sini.
                      </p>

                  </div>
              `;

              return;
          }


          const upcoming =
              schedules
                  .filter(schedule =>
                      schedule.status !== "completed"
                  )
                  .slice(0, 5);


          if (upcoming.length === 0) {

              upcomingScheduleList.innerHTML = `
                  <div class="empty">

                      <div class="empty-icon">✅</div>

                      <h3>Tidak ada schedule mendatang</h3>

                      <p>
                          Semua schedule sudah selesai.
                      </p>

                  </div>
              `;

              return;
          }


          upcomingScheduleList.innerHTML =
              upcoming.map(schedule => {

                  const scheduleDate =
                      formatScheduleDate(
                          schedule.schedule_time
                      );


                  const status =
                      String(
                          schedule.status || "scheduled"
                      ).toLowerCase();


                  return `
                      <div class="upcoming-schedule-item">

                          <div class="upcoming-schedule-icon">
                              📅
                          </div>

                          <div class="upcoming-schedule-info">

                              <strong>
                                  ${escapeHtml(
                                      schedule.post_title ||
                                      "Untitled Post"
                                  )}
                              </strong>

                              <div class="upcoming-schedule-meta">

                                  <span>
                                      🤖 ${escapeHtml(
                                          schedule.bot_name ||
                                          "-"
                                      )}
                                  </span>

                                  <span>
                                      📡 ${escapeHtml(
                                          schedule.destination_name ||
                                          "-"
                                      )}
                                  </span>

                                  <span>
                                      🕐 ${scheduleDate}
                                  </span>

                              </div>

                          </div>

                          <div class="upcoming-schedule-status ${getScheduleStatusClass(status)}">
                              ${escapeHtml(status)}
                          </div>

                      </div>
                  `;

              }).join("");


      } catch (error) {

          console.error(
              "UPCOMING SCHEDULE ERROR:",
              error
          );

      }

  }


  function formatScheduleDate(value) {

      if (!value) {
          return "-";
      }


      const date =
          new Date(
              String(value).replace(" ", "T")
          );


      if (Number.isNaN(date.getTime())) {
          return value;
      }


      return date.toLocaleString(
          "id-ID",
          {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
          }
      );

  }


  function getScheduleStatusClass(status) {

      if (
          status === "completed" ||
          status === "success"
      ) {
          return "schedule-success";
      }


      if (
          status === "failed" ||
          status === "error"
      ) {
          return "schedule-failed";
      }


      return "schedule-waiting";

  }


  function escapeHtml(value) {

      return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

  }


  loadDashboard();
  loadUpcomingSchedules();


  setInterval(
      loadDashboard,
      10000
  );


  setInterval(
      loadUpcomingSchedules,
      10000
  );


    console.log(
        "Telegram Auto Poster - Dashboard loaded."
    );

});

async function updateSystemStatus() {
    const serverEl = document.getElementById("serverStatus");
    const databaseEl = document.getElementById("databaseStatus");
    const telegramEl = document.getElementById("telegramStatus");
    const workerEl = document.getElementById("workerStatus");

    try {
        const response = await fetch("/api/health", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        if (data.success && data.status === "online") {
            serverEl.textContent = "● Online";
            serverEl.className = "online";

            databaseEl.textContent = "● Connected";
            databaseEl.className = "online";

            telegramEl.textContent = "● Ready";
            telegramEl.className = "online";
        } else {
            throw new Error("Server offline");
        }

    } catch (error) {
        serverEl.textContent = "● Offline";
        serverEl.className = "offline";

        databaseEl.textContent = "● Offline";
        databaseEl.className = "offline";

        telegramEl.textContent = "● Offline";
        telegramEl.className = "offline";
    }

    try {
        const response = await fetch("/api/worker-status", {
            cache: "no-store"
        });

        const data = await response.json();

        if (data.success && data.status === "online") {
            workerEl.textContent = "● Online";
            workerEl.className = "online";
        } else {
            workerEl.textContent = "● Offline";
            workerEl.className = "offline";
        }

    } catch (error) {
        workerEl.textContent = "● Offline";
        workerEl.className = "offline";
    }
}

updateSystemStatus();

setInterval(updateSystemStatus, 5000);
