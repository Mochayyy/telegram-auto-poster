console.log(
    "Telegram Auto Poster Dashboard loaded."
);


/* =========================================
   DASHBOARD STATS
========================================= */

async function loadDashboardStats() {

    try {

        const response =
            await fetch(
                "/api/posts"
            );


        const result =
            await response.json();


        if (!result.success) {
            return;
        }


        const posts =
            result.posts || [];


        const scheduledElement =
            document.getElementById(
                "scheduledPosts"
            );


        if (scheduledElement) {

            scheduledElement.textContent =
                posts.length;

        }


    } catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboardStats();

    }
);
