/* =========================================
   TELEGRAM AUTO POSTER
   POSTS MANAGER
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       ELEMENT
    ========================================= */

    const postForm =
        document.getElementById("postForm");

    const postTitle =
        document.getElementById("postTitle");

    const postContent =
        document.getElementById("postContent");

    const postMedia =
        document.getElementById("postMedia");

    const previewTitle =
        document.getElementById("previewTitle");

    const previewContent =
        document.getElementById("previewContent");

    const previewMedia =
        document.getElementById("previewMedia");

    const previewImage =
        document.getElementById("previewImage");

    const previewVideo =
        document.getElementById("previewVideo");

    const selectedFile =
        document.getElementById("selectedFile");

    const selectedFileName =
        document.getElementById("selectedFileName");

    const removeMediaBtn =
        document.getElementById("removeMediaBtn");

    const buttonsContainer =
        document.getElementById("buttonsContainer");

    const previewButtons =
        document.getElementById("previewButtons");

    const emptyButtons =
        document.getElementById("emptyButtons");

    const addButtonBtn =
        document.getElementById("addButtonBtn");

    const charCount =
        document.getElementById("charCount");

    const footerTemplate =
        document.getElementById("footerTemplate");

    const enableFooter =
        document.getElementById("enableFooter");

    const previewFooter =
        document.getElementById("previewFooter");

    const previewFooterContent =
        document.getElementById(
            "previewFooterContent"
        );

    const previewFooterButtons =
        document.getElementById(
            "previewFooterButtons"
        );

  const footerCharCount =
        document.getElementById(
            "footerCharCount"
        );

    const resetFooterBtn =
        document.getElementById(
            "resetFooterBtn"
        );

    const addFooterButtonBtn =
        document.getElementById(
            "addFooterButtonBtn"
        );

    const footerButtonsContainer =
        document.getElementById(
            "footerButtonsContainer"
        );

    const emptyFooterButtons =
        document.getElementById(
            "emptyFooterButtons"
        );

  const resetPostBtn =
        document.getElementById(
            "resetPostBtn"
        );

  const editPostId =
      localStorage.getItem("editPostId");

  let editingPost = null;


    /* =========================================
       SAFETY CHECK
    ========================================= */

    if (!postForm) {
        console.error(
            "ERROR: #postForm tidak ditemukan."
        );
        return;
    }


    /* =========================================
       DEFAULT FOOTER
    ========================================= */

    const DEFAULT_FOOTER =
`TAYO4D OFFICIAL
Daftar TAYO4D
Akses Login TAYO4D
Facebook TAYO4D
Telegram TAYO4D
Livechat TAYO4D`;


    /* =========================================
       FOOTER BUTTON DATA
    ========================================= */

    let footerButtons = [];


    /* =========================================
       LOAD FOOTER
    ========================================= */

    function loadFooter() {

        const saved =
            localStorage.getItem(
                "telegramPosterFooter"
            );

        footerTemplate.value =
            saved !== null
                ? saved
                : DEFAULT_FOOTER;

        updateFooter();

    }


    /* =========================================
       SAVE FOOTER
    ========================================= */

    function saveFooter() {

        localStorage.setItem(
            "telegramPosterFooter",
            footerTemplate.value
        );

    }


    /* =========================================
       TITLE
    ========================================= */

    postTitle.addEventListener(
        "input",
        () => {

            previewTitle.textContent =
                postTitle.value.trim() ||
                "Judul Post";

        }
    );


    /* =========================================
       CONTENT
    ========================================= */

    postContent.addEventListener(
        "input",
        () => {

            previewContent.textContent =
                postContent.value ||
                "Isi pesan akan muncul di sini...";

            charCount.textContent =
                `${postContent.value.length} karakter`;

        }
    );


    /* =========================================
       MEDIA
    ========================================= */

    postMedia.addEventListener(
        "change",
        () => {

            const file =
                postMedia.files[0];

            if (!file) {
                clearMedia();
                return;
            }

            selectedFileName.textContent =
                file.name;

            selectedFile.classList.remove(
                "hidden"
            );

            const url =
                URL.createObjectURL(file);


            if (
                file.type.startsWith("image/")
            ) {

                previewImage.src =
                    url;

                previewImage.classList.remove(
                    "hidden"
                );

                previewVideo.pause();

                previewVideo.removeAttribute(
                    "src"
                );

                previewVideo.load();

                previewVideo.classList.add(
                    "hidden"
                );

                previewMedia.classList.remove(
                    "hidden"
                );

                return;
            }


            if (
                file.type.startsWith("video/")
            ) {

                previewVideo.src =
                    url;

                previewVideo.classList.remove(
                    "hidden"
                );

                previewImage.removeAttribute(
                    "src"
                );

                previewImage.classList.add(
                    "hidden"
                );

                previewMedia.classList.remove(
                    "hidden"
                );

                return;
            }

            clearMedia();

        }
    );


    /* =========================================
       CLEAR MEDIA
    ========================================= */

    function clearMedia() {

        postMedia.value =
            "";

        selectedFile.classList.add(
            "hidden"
        );

        selectedFileName.textContent =
            "-";

        previewMedia.classList.add(
            "hidden"
        );

        previewImage.removeAttribute(
            "src"
        );

        previewVideo.pause();

        previewVideo.removeAttribute(
            "src"
        );

        previewVideo.load();

    }


    /* =========================================
       REMOVE MEDIA
    ========================================= */

    removeMediaBtn.addEventListener(
        "click",
        clearMedia
    );


    /* =========================================
       ADD BUTTON
    ========================================= */

    addButtonBtn.addEventListener(
        "click",
        () => {

            createButtonRow();

            updateButtonsPreview();

        }
    );


    /* =========================================
       CREATE MAIN BUTTON
    ========================================= */

    function createButtonRow(
        text = "",
        url = ""
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "button-row";


        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "button-row-grid";


        const textField =
            document.createElement(
                "div"
            );

        textField.className =
            "button-field";


        const textLabel =
            document.createElement(
                "label"
            );

        textLabel.textContent =
            "Teks Button";


        const textInput =
            document.createElement(
                "input"
            );

        textInput.type =
            "text";

        textInput.className =
            "button-text";

        textInput.placeholder =
            "Contoh: DAFTAR SEKARANG";

        textInput.value =
            text;


        textField.appendChild(
            textLabel
        );

        textField.appendChild(
            textInput
        );


        const urlField =
            document.createElement(
                "div"
            );

        urlField.className =
            "button-field";


        const urlLabel =
            document.createElement(
                "label"
            );

        urlLabel.textContent =
            "Link / URL";


        const urlInput =
            document.createElement(
                "input"
            );

        urlInput.type =
            "url";

        urlInput.className =
            "button-url";

        urlInput.placeholder =
            "https://contoh.com";

        urlInput.value =
            url;


        urlField.appendChild(
            urlLabel
        );

        urlField.appendChild(
            urlInput
        );


        const removeButton =
            document.createElement(
                "button"
            );

        removeButton.type =
            "button";

        removeButton.className =
            "remove-button";

        removeButton.textContent =
            "Hapus";


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

                updateButtonsPreview();

            }
        );


        textInput.addEventListener(
            "input",
            updateButtonsPreview
        );

        urlInput.addEventListener(
            "input",
            updateButtonsPreview
        );


        grid.appendChild(
            textField
        );

        grid.appendChild(
            urlField
        );

        grid.appendChild(
            removeButton
        );

        row.appendChild(
            grid
        );

        buttonsContainer.appendChild(
            row
        );

    }


    /* =========================================
       MAIN BUTTON PREVIEW
    ========================================= */

    function updateButtonsPreview() {

        previewButtons.innerHTML =
            "";

        const rows =
            buttonsContainer.querySelectorAll(
                ".button-row"
            );

        emptyButtons.classList.toggle(
            "hidden",
            rows.length > 0
        );


        rows.forEach(
            row => {

                const text =
                    row.querySelector(
                        ".button-text"
                    ).value.trim();

                const url =
                    row.querySelector(
                        ".button-url"
                    ).value.trim();


                if (!text || !url) {
                    return;
                }


                const button =
                    document.createElement(
                        "a"
                    );

                button.className =
                    "telegram-button-preview";

                button.href =
                    url;

                button.target =
                    "_blank";

                button.rel =
                    "noopener noreferrer";

                button.textContent =
                    text;


                previewButtons.appendChild(
                    button
                );

            }
        );

    }


    /* =========================================
       GET MAIN BUTTON DATA
    ========================================= */

    function getButtonData() {

        const rows =
            buttonsContainer.querySelectorAll(
                ".button-row"
            );

        const buttons = [];


        rows.forEach(
            row => {

                const text =
                    row.querySelector(
                        ".button-text"
                    ).value.trim();

                const url =
                    row.querySelector(
                        ".button-url"
                    ).value.trim();


                if (
                    text &&
                    url
                ) {

                    buttons.push({
                        text: text,
                        url: url
                    });

                }

            }
        );


        return buttons;

    }

    /* =========================================
       FOOTER BUTTON
    ========================================= */

    function createFooterButtonRow(
        text = "",
        url = ""
    ) {

        const row =
            document.createElement("div");

        row.className =
            "button-row footer-button-row";


        const grid =
            document.createElement("div");

        grid.className =
            "button-row-grid";


        /* TEXT */

        const textField =
            document.createElement("div");

        textField.className =
            "button-field";


        const textLabel =
            document.createElement("label");

        textLabel.textContent =
            "Teks Button";


        const textInput =
            document.createElement("input");

        textInput.type =
            "text";

        textInput.className =
            "footer-button-text";

        textInput.placeholder =
            "Contoh: WEBSITE";

        textInput.value =
            text;


        textField.appendChild(
            textLabel
        );

        textField.appendChild(
            textInput
        );


        /* URL */

        const urlField =
            document.createElement("div");

        urlField.className =
            "button-field";


        const urlLabel =
            document.createElement("label");

        urlLabel.textContent =
            "Link / URL";


        const urlInput =
            document.createElement("input");

        urlInput.type =
            "url";

        urlInput.className =
            "footer-button-url";

        urlInput.placeholder =
            "https://contoh.com";

        urlInput.value =
            url;


        urlField.appendChild(
            urlLabel
        );

        urlField.appendChild(
            urlInput
        );


        /* REMOVE */

        const removeButton =
            document.createElement("button");

        removeButton.type =
            "button";

        removeButton.className =
            "remove-button";

        removeButton.textContent =
            "Hapus";


        removeButton.addEventListener(
            "click",
            () => {

                row.remove();

                updateFooterButtonsPreview();

            }
        );


        textInput.addEventListener(
            "input",
            updateFooterButtonsPreview
        );

        urlInput.addEventListener(
            "input",
            updateFooterButtonsPreview
        );


        grid.appendChild(
            textField
        );

        grid.appendChild(
            urlField
        );

        grid.appendChild(
            removeButton
        );

        row.appendChild(
            grid
        );

        footerButtonsContainer.appendChild(
            row
        );

    }


    function updateFooterButtonsPreview() {

        previewFooterButtons.innerHTML =
            "";

        const rows =
            footerButtonsContainer.querySelectorAll(
                ".footer-button-row"
            );


        emptyFooterButtons.classList.toggle(
            "hidden",
            rows.length > 0
        );


        rows.forEach(
            row => {

                const text =
                    row.querySelector(
                        ".footer-button-text"
                    ).value.trim();

                const url =
                    row.querySelector(
                        ".footer-button-url"
                    ).value.trim();


                if (!text || !url) {
                    return;
                }


                const button =
                    document.createElement("a");

                button.className =
                    "telegram-button-preview";

                button.href =
                    url;

                button.target =
                    "_blank";

                button.rel =
                    "noopener noreferrer";

                button.textContent =
                    text;


                previewFooterButtons.appendChild(
                    button
                );

            }
        );

    }


    function getFooterButtonData() {

        const rows =
            footerButtonsContainer.querySelectorAll(
                ".footer-button-row"
            );

        const buttons = [];


        rows.forEach(
            row => {

                const text =
                    row.querySelector(
                        ".footer-button-text"
                    ).value.trim();

                const url =
                    row.querySelector(
                        ".footer-button-url"
                    ).value.trim();


                if (
                    text &&
                    url
                ) {

                    buttons.push({
                        text: text,
                        url: url
                    });

                }

            }
        );


        return buttons;

    }


    if (addFooterButtonBtn) {
        addFooterButtonBtn.addEventListener("click", () => {

            console.log("🔥 FOOTER BUTTON DIKLIK");

            createFooterButtonRow();
            updateFooterButtonsPreview();

        });
    }

    /* =========================================
       FOOTER
    ========================================= */

    footerTemplate.addEventListener(
        "input",
        () => {

            saveFooter();

            updateFooter();

        }
    );


    enableFooter.addEventListener(
        "change",
        updateFooter
    );


    function updateFooter() {

        const footer =
            footerTemplate.value.trim();


        footerCharCount.textContent =
            `${footer.length} karakter`;


        if (
            !enableFooter.checked
        ) {

            previewFooter.classList.add(
                "hidden"
            );

            previewFooterContent.textContent =
                "";

            previewFooterButtons.innerHTML =
                "";

            return;

        }


        if (!footer) {

            previewFooterContent.textContent =
                "";

        } else {

            previewFooterContent.textContent =
                footer;

        }


        previewFooter.classList.remove(
            "hidden"
        );


        updateFooterButtonsPreview();

    }

    /* =========================================
       RESET FOOTER
    ========================================= */

    resetFooterBtn.addEventListener(
        "click",
        () => {

            footerTemplate.value =
                DEFAULT_FOOTER;

            enableFooter.checked =
                true;

            saveFooter();

            updateFooter();

        }
    );


    /* =========================================
       RESET POST
    ========================================= */

    resetPostBtn.addEventListener(
        "click",
        () => {

            const yes =
                confirm(
                    "Reset seluruh isi post?"
                );

            if (!yes) {
                return;
            }

            postForm.reset();

            buttonsContainer.innerHTML =
                "";

            previewButtons.innerHTML =
                "";

            footerButtonsContainer.innerHTML =
                "";

            previewFooterButtons.innerHTML =
                "";

          previewTitle.textContent =
                "Judul Post";

            previewContent.textContent =
                "Isi pesan akan muncul di sini...";

            charCount.textContent =
                "0 karakter";

            clearMedia();

            loadFooter();

        }
  );

  async function loadEditPost() {

    console.log("🔥 LOAD EDIT POST DIPANGGIL");
    console.log("🆔 EDIT POST ID:", editPostId);

        if (!editPostId) {
            return;
        }

        try {

            const response =
                await fetch("/api/posts");

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Gagal mengambil data post."
                );

            }

            const post =
                result.posts.find(
                    item =>
                        String(item.id) ===
                        String(editPostId)
                );

            if (!post) {

                alert(
                    "Post yang ingin diedit tidak ditemukan."
                );

                localStorage.removeItem(
                    "editPostId"
                );

                return;
            }

          editingPost = post;

          function showExistingMedia(mediaPath) {

              if (!mediaPath) {
                  return;
              }


              previewMedia.style.display =
                  "block";


              previewImage.style.display =
                  "none";

              previewVideo.style.display =
                  "none";


              const mediaUrl =
                  mediaPath;


              const extension =
                  mediaPath
                      .split(".")
                      .pop()
                      .toLowerCase();


              const imageExtensions = [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp"
              ];


              const videoExtensions = [
                  "mp4",
                  "webm",
                  "mov",
                  "avi"
              ];


              if (
                  imageExtensions.includes(
                      extension
                  )
              ) {

                  previewImage.src =
                      mediaUrl;

                  previewImage.style.display =
                      "block";

                  return;
              }


              if (
                  videoExtensions.includes(
                      extension
                  )
              ) {

                  previewVideo.src =
                      mediaUrl;

                  previewVideo.style.display =
                      "block";

                  return;
              }


              previewMedia.style.display =
                  "none";

          }


            // =========================================
            // TITLE
            // =========================================

            postTitle.value =
                post.title || "";


            // =========================================
            // CONTENT
            // =========================================

            postContent.value =
                post.content || "";


            // =========================================
            // MAIN BUTTONS
            // =========================================

            buttonsContainer.innerHTML = "";

            const mainButtons =
                post.buttons || [];

            mainButtons.forEach(button => {

                createButtonRow(
                    button.text || "",
                    button.url || ""
                );

            });


            updateButtonsPreview();


            // =========================================
            // FOOTER
            // =========================================

            if (
                post.footer &&
                post.footer.trim()
            ) {

                enableFooter.checked = true;

                footerTemplate.value =
                    post.footer;

            } else {

                enableFooter.checked = false;

                footerTemplate.value = "";

            }


            updateFooter();


            // =========================================
            // FOOTER BUTTONS
            // =========================================

            footerButtonsContainer.innerHTML = "";

            const footerButtons =
                post.footer_buttons || [];

            footerButtons.forEach(button => {

                createFooterButtonRow(
                    button.text || "",
                    button.url || ""
                );

            });


            updateFooterButtonsPreview();


            // =========================================
            // MEDIA PREVIEW
            // =========================================

            if (post.media) {

                showExistingMedia(
                    post.media
                );

            }


            // =========================================
            // CHARACTER COUNTER
            // =========================================

            updateCharCount();

            updateFooterCharCount();


            // =========================================
            // UBAH TULISAN BUTTON SAVE
            // =========================================

            const saveButton =
                postForm.querySelector(
                    'button[type="submit"]'
                );

            if (saveButton) {

                saveButton.textContent =
                    "💾 UPDATE POST";

            }


            // =========================================
            // HAPUS ID EDIT
            // =========================================
            // Jangan dihapus sekarang.
            // ID tetap diperlukan sampai POST berhasil update.


        } catch (error) {

            console.error(
                "LOAD EDIT POST ERROR:",
                error
            );

            alert(
                "❌ Gagal memuat post.\n\n" +
                error.message
            );

        }

    }


    /* =========================================
       SAVE POST
    ========================================= */

    postForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                postTitle.value.trim();

            const content =
                postContent.value.trim();

            const footer =
                enableFooter.checked
                    ? footerTemplate.value.trim()
                    : "";


            if (!title) {

                alert(
                    "Judul wajib diisi."
                );

                postTitle.focus();

                return;

            }


            if (!content) {

                alert(
                    "Text / Isi Pesan wajib diisi."
                );

                postContent.focus();

                return;

            }

            const buttons =
                getButtonData();

            const footerButtons =
                getFooterButtonData();

            console.log(
                "MAIN BUTTONS:",
                buttons
            );

            console.log(
                "FOOTER BUTTONS:",
                footerButtons
            );


            const formData =
                new FormData();


            formData.append(
                "title",
                title
            );

            formData.append(
                "content",
                content
            );

            formData.append(
                "footer",
                footer
            );

            formData.append(
                "buttons",
                JSON.stringify(
                    buttons
                )
          );

            formData.append(
                "footer_buttons",
                JSON.stringify(
                    footerButtons
                )
          );


            if (
                postMedia.files.length > 0
            ) {

                formData.append(
                    "media",
                    postMedia.files[0]
                );

            }


            const saveButton =
                postForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                saveButton.textContent;


            saveButton.disabled =
                true;

            saveButton.textContent =
                "Menyimpan...";


            try {

              const isEdit =
                  Boolean(editPostId);

              const apiUrl =
                  isEdit
                      ? `/api/posts/${editPostId}`
                      : "/api/posts";

              const apiMethod =
                  isEdit
                      ? "PUT"
                      : "POST";

              const response =
                  await fetch(
                      apiUrl,
                      {
                          method: apiMethod,
                          body: formData
                      }
                  );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Gagal menyimpan post."
                    );

                }


                if (isEdit) {

                    alert(
                        "✅ POST BERHASIL DIPERBARUI!\n\n" +
                        `Post ID : ${result.post_id}\n` +
                        `Button : ${result.buttons}\n` +
                        `Footer Button : ${result.footer_buttons}`
                    );

                    localStorage.removeItem(
                        "editPostId"
                    );

                    window.location.href =
                        "post-list.html";

                } else {

                    alert(
                        "✅ POST BERHASIL DISIMPAN!\n\n" +
                        `Post ID : ${result.post_id}\n` +
                        `Button : ${result.buttons}\n` +
                        `Footer Button : ${result.footer_buttons}`
                    );

                    console.log(
                        "POST SAVED:",
                        result
                    );

                }


            } catch (error) {

                console.error(
                    "SAVE POST ERROR:",
                    error
                );

                alert(
                    "Gagal menyimpan post.\n\n" +
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


    /* =========================================
       START
    ========================================= */

    loadFooter();

    if (editPostId) {
        loadEditPost();
    }

    console.log(
        "Telegram Auto Poster - Posts loaded."
    );
});
