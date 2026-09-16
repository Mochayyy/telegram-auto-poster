document.addEventListener("DOMContentLoaded", () => {

    const postList =
        document.getElementById("postList");

    const searchPost =
        document.getElementById("searchPost");

    const refreshPostsBtn =
        document.getElementById("refreshPostsBtn");


    let posts = [];


    async function loadPosts() {

        postList.innerHTML = `
            <div class="loading">
                Memuat post...
            </div>
        `;

        try {

            const response =
                await fetch("/api/posts");

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    "Gagal mengambil data post."
                );

            }

            posts = result.posts || [];

            renderPosts(posts);

        } catch (error) {

            console.error(
                "LOAD POSTS ERROR:",
                error
            );

            postList.innerHTML = `
                <div class="empty-posts">
                    ❌ Gagal memuat post.
                    <br><br>
                    ${error.message}
                </div>
            `;

        }

    }


    function renderPosts(data) {

        if (!data.length) {

            postList.innerHTML = `
                <div class="empty-posts">
                    📝 Belum ada post.
                    <br><br>
                    Klik <strong>+ Buat Post</strong>
                    untuk membuat post pertama.
                </div>
            `;

            return;

        }


        postList.innerHTML =
            data.map(post => {

                const buttons =
                    post.buttons || [];

                const footerButtons =
                    post.footer_buttons || [];


                const allButtons =
                    [
                        ...buttons,
                        ...footerButtons
                    ];


                return `

                    <article
                        class="post-card"
                        data-id="${post.id}"
                    >

                        <div class="post-card-header">

                            <div class="post-title">
                                ${escapeHtml(
                                    post.title
                                )}
                            </div>

                            <div class="post-date">
                                ${escapeHtml(
                                    post.created_at
                                )}
                            </div>

                        </div>


                        <div class="post-content">
                            ${escapeHtml(
                                post.content
                            )}
                        </div>


                        ${
                            post.footer
                            ?
                            `
                            <div class="post-footer">

                                <strong>
                                    FOOTER
                                </strong>

                                <br>

                                ${escapeHtml(
                                    post.footer
                                )}

                            </div>
                            `
                            :
                            ""
                        }


                        ${
                            allButtons.length
                            ?
                            `
                            <div class="post-buttons">

                                ${
                                    allButtons
                                        .map(button => `
                                            <span
                                                class="post-button"
                                            >
                                                🔗
                                                ${escapeHtml(
                                                    button.text
                                                )}
                                            </span>
                                        `)
                                        .join("")
                                }

                            </div>
                            `
                            :
                            ""
                        }


                        <div class="post-actions">

                            <button
                                type="button"
                                class="btn-preview"
                                onclick="previewPost(${post.id})"
                            >
                                👁 Preview
                            </button>

                            <button
                                type="button"
                                class="btn-edit"
                                onclick="editPost(${post.id})"
                            >
                                ✏️ Edit
                            </button>

                            <button
                                type="button"
                                class="btn-delete"
                                onclick="deletePost(${post.id})"
                            >
                                🗑 Hapus
                            </button>

                        </div>

                    </article>

                `;

            }).join("");

    }


    function escapeHtml(value) {

        if (value === null ||
            value === undefined) {

            return "";

        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    searchPost.addEventListener(
        "input",
        () => {

            const keyword =
                searchPost.value
                    .toLowerCase()
                    .trim();

            const filtered =
                posts.filter(post => {

                    return (
                        String(post.title || "")
                            .toLowerCase()
                            .includes(keyword)

                        ||

                        String(post.content || "")
                            .toLowerCase()
                            .includes(keyword)

                        ||

                        String(post.footer || "")
                            .toLowerCase()
                            .includes(keyword)
                    );

                });


            renderPosts(filtered);

        }
    );


    refreshPostsBtn.addEventListener(
        "click",
        loadPosts
    );


    window.previewPost = function (id) {

        const post =
            posts.find(
                item => item.id === id
            );

        if (!post) return;

        alert(
            "PREVIEW POST\n\n" +
            post.title +
            "\n\n" +
            post.content +
            (
                post.footer
                ?
                "\n\n" +
                post.footer
                :
                ""
            )
        );

    };


    window.editPost = function (id) {

        const post =
            posts.find(
                item => item.id === id
            );

        if (!post) return;

        localStorage.setItem(
            "editPostId",
            id
        );

        window.location.href =
            "posts.html";

    };


    window.deletePost = async function (id) {

        const post =
            posts.find(
                item => item.id === id
            );

        if (!post) return;


        const confirmed =
            confirm(
                `Hapus post "${post.title}"?\n\n` +
                `Post, tombol, footer button, dan schedule terkait akan dihapus.`
            );

        if (!confirmed) return;


        try {

            const response =
                await fetch(`/api/posts/${id}`, {
                    method: "DELETE"
                });


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Gagal menghapus post."
                );

            }


            alert(
                "✅ Post berhasil dihapus."
            );


            await loadPosts();


        } catch (error) {

            console.error(
                "DELETE POST ERROR:",
                error
            );


            alert(
                "❌ Gagal menghapus post.\n\n" +
                error.message
            );

        }

    };


    loadPosts();

});
