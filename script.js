const API_BASE_URL = "https://vedicscriptures.github.io";
const topChapterSelect = document.getElementById("top-chapter-select");
const topVerseSelect = document.getElementById("top-verse-select");
const readingArea = document.getElementById("reading-area");
const treeRoot = document.getElementById("tree-root");

function triggerFadeIn(element) {
  element.classList.remove("fade-in");
  void element.offsetWidth;
  element.classList.add("fade-in");
}

function sanitize(str) {
  if (typeof str !== "string") return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-bs-theme");
  html.setAttribute(
    "data-bs-theme",
    currentTheme === "dark" ? "light" : "dark",
  );
});

async function init() {
  try {
    const res = await fetch(`${API_BASE_URL}/chapters`);
    const chapters = await res.json();

    chapters.forEach((ch) => {
      const opt = document.createElement("option");
      opt.value = ch.chapter_number;
      const chapterEnglishName = ch.translation || ch.name;
      opt.textContent = `Chapter ${ch.chapter_number}: ${chapterEnglishName}`;
      topChapterSelect.appendChild(opt);

      const li = document.createElement("li");

      const titleDiv = document.createElement("div");
      titleDiv.className = "tree-chapter";
      titleDiv.textContent = `Chapter ${ch.chapter_number}: ${chapterEnglishName}`;

      const verseUl = document.createElement("ul");
      verseUl.className = "tree-verses";
      verseUl.id = `tree-ch-${ch.chapter_number}`;

      for (let i = 1; i <= ch.verses_count; i++) {
        const vLi = document.createElement("li");
        vLi.className = "tree-verse-item";
        vLi.textContent = `Verse ${i}`;

        vLi.addEventListener("click", (e) => {
          e.stopPropagation();
          loadVerse(ch.chapter_number, i, ch.verses_count);
        });

        verseUl.appendChild(vLi);
      }

      titleDiv.addEventListener("click", () => {
        const isOpen = verseUl.classList.contains("open");
        document
          .querySelectorAll(".tree-verses")
          .forEach((el) => el.classList.remove("open"));
        document
          .querySelectorAll(".tree-chapter")
          .forEach((el) => el.classList.remove("active"));

        if (!isOpen) {
          verseUl.classList.add("open");
          titleDiv.classList.add("active");
        }
        loadChapter(ch.chapter_number);
      });

      li.appendChild(titleDiv);
      li.appendChild(verseUl);
      treeRoot.appendChild(li);
    });
  } catch (e) {
    readingArea.innerHTML = '<p class="text-danger">Failed to initialize.</p>';
  }
}

function updateTopVerseSelect(versesCount) {
  topVerseSelect.innerHTML =
    '<option value="" selected disabled>Select Verse</option>';
  for (let i = 1; i <= versesCount; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Verse ${i}`;
    topVerseSelect.appendChild(opt);
  }
  topVerseSelect.disabled = false;
}

async function loadChapter(chNum) {
  topChapterSelect.value = chNum;
  readingArea.innerHTML =
    '<div class="d-flex justify-content-center"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await fetch(`${API_BASE_URL}/chapter/${chNum}`);
    const data = await res.json();

    updateTopVerseSelect(data.verses_count);

    const nameHi = data.name;
    const nameEn = data.translation || "";
    const meaningHi = data.meaning && data.meaning.hi ? data.meaning.hi : "";
    const meaningEn = data.meaning && data.meaning.en ? data.meaning.en : "";
    const summaryHi =
      data.summary && data.summary.hi
        ? data.summary.hi
        : "सारांश उपलब्ध नहीं है।";
    const summaryEn =
      data.summary && data.summary.en
        ? data.summary.en
        : "Summary not available.";

    readingArea.innerHTML = `
        <div class="text-center mb-5 border-bottom pb-4 theme-border">
            <h1 class="display-5 fw-bold mb-2 theme-heading">${sanitize(nameHi)}</h1>
            <h2 class="h3 theme-text-muted mb-4">${sanitize(nameEn)}</h2>
            <div class="d-flex justify-content-center gap-4">
                <span class="badge bg-secondary fs-6">${sanitize(meaningHi)}</span>
                <span class="badge bg-secondary fs-6">${sanitize(meaningEn)}</span>
            </div>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="translation-box">
                    <h4 class="content-title">सारांश (Hindi)</h4>
                    <p class="fs-6 lh-lg">${sanitize(summaryHi)}</p>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="translation-box">
                    <h4 class="content-title">Summary (English)</h4>
                    <p class="fs-6 lh-lg">${sanitize(summaryEn)}</p>
                </div>
            </div>
        </div>
    `;
    triggerFadeIn(readingArea);
  } catch (e) {
    readingArea.innerHTML =
      '<p class="text-danger">Failed to load chapter.</p>';
  }
}

async function loadVerse(chNum, vNum, versesCount = null) {
  topChapterSelect.value = chNum;

  if (topVerseSelect.disabled) {
    if (versesCount) {
      updateTopVerseSelect(versesCount);
    } else {
      const res = await fetch(`${API_BASE_URL}/chapter/${chNum}`);
      const data = await res.json();
      updateTopVerseSelect(data.verses_count);
    }
  }

  topVerseSelect.value = vNum;

  document
    .querySelectorAll(".tree-verse-item")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".tree-verses")
    .forEach((el) => el.classList.remove("open"));
  document
    .querySelectorAll(".tree-chapter")
    .forEach((el) => el.classList.remove("active"));

  const ul = document.getElementById(`tree-ch-${chNum}`);
  if (ul) {
    ul.classList.add("open");
    ul.previousElementSibling.classList.add("active");
    ul.children[vNum - 1].classList.add("active");
  }

  readingArea.innerHTML =
    '<div class="d-flex justify-content-center"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await fetch(`${API_BASE_URL}/slok/${chNum}/${vNum}`);

    const slokData = await res.json();

    const authorKeys = Object.keys(slokData).filter(
      (k) =>
        !["_id", "chapter", "verse", "slok", "transliteration"].includes(k),
    );

    let authorOptions = "";
    authorKeys.forEach((k) => {
      const authorName = slokData[k].author || k;
      authorOptions += `<option value="${sanitize(k)}">${sanitize(authorName)}</option>`;
    });

    readingArea.innerHTML = `
        <div class="verse-card p-4 p-md-5 mb-4 shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2 theme-border">
                <span class="fw-bold fs-5 theme-heading">Chapter ${sanitize(String(slokData.chapter))} : Verse ${sanitize(String(slokData.verse))}</span>
            </div>
            <div class="sanskrit-text text-center fw-bold mb-4">${sanitize(slokData.slok)}</div>
            <div class="text-center fs-5 theme-text-muted">${sanitize(slokData.transliteration)}</div>
        </div>

        <div class="d-flex align-items-center gap-3 mb-3 p-3 rounded commentary-box">
            <label for="author-select" class="fw-bold m-0">Select Commentary:</label>
            <select id="author-select" class="form-select custom-select w-auto">
                ${authorOptions}
            </select>
        </div>

        <div id="author-content-area"></div>
    `;
    triggerFadeIn(readingArea);
    const authorSelect = document.getElementById("author-select");

    authorSelect.addEventListener("change", (e) =>
      renderAuthorContent(e.target.value, slokData),
    );

    if (authorKeys.length > 0) {
      authorSelect.value = authorKeys[0];
      renderAuthorContent(authorKeys[0], slokData);
    }
  } catch (e) {
    readingArea.innerHTML = '<p class="text-danger">Failed to load verse.</p>';
  }
}

function renderAuthorContent(authorKey, slokData) {
  const data = slokData[authorKey];
  const area = document.getElementById("author-content-area");

  let html = `<div class="author-block shadow-sm">
        <h3 class="mb-4 pb-2 border-bottom theme-border" style="color: var(--accent-secondary);">${sanitize(data.author || authorKey)}</h3>`;

  const types = [
    { key: "et", label: "English Translation" },
    { key: "ec", label: "English Commentary" },
    { key: "ht", label: "Hindi Translation" },
    { key: "hc", label: "Hindi Commentary" },
    { key: "st", label: "Sanskrit Translation" },
    { key: "sc", label: "Sanskrit Commentary" },
  ];

  types.forEach((t) => {
    if (data[t.key]) {
      html += `
                <div class="mb-4">
                    <span class="author-type-label">${sanitize(t.label)}</span>
                    <p class="fs-5 lh-base" style="white-space: pre-wrap;">${sanitize(data[t.key])}</p>
                </div>
            `;
    }
  });

  html += `</div>`;
  area.innerHTML = html;
}

topChapterSelect.addEventListener("change", (e) => loadChapter(e.target.value));
topVerseSelect.addEventListener("change", (e) =>
  loadVerse(topChapterSelect.value, e.target.value),
);

document.addEventListener("DOMContentLoaded", init);
