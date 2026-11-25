(() => {
  const status = document.getElementById("copy-status");
  let timer;
  function announce(text) {
    status.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(() => { status.textContent = ""; }, 4500);
  }
  for (const button of document.querySelectorAll("[data-copy]")) {
    button.hidden = false;
    button.addEventListener("click", async () => {
      const block = document.getElementById(button.dataset.copy);
      if (!block) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(block.textContent.trim());
        announce("Command copied. Review placeholders before running.");
      } catch {
        const selection = window.getSelection();
        if (selection) { const range = document.createRange(); range.selectNodeContents(block); selection.removeAllRanges(); selection.addRange(range); }
        announce("Text selected. Press Ctrl+C or Cmd+C to copy.");
      }
    });
  }
  const expand = document.getElementById("expand");
  const setup = Array.from(document.querySelectorAll("#setup details"));
  expand.hidden = false;
  const sync = () => { const all = setup.every((node) => node.open); expand.textContent = all ? "Collapse guides" : "Expand guides"; expand.setAttribute("aria-expanded", String(all)); };
  expand.addEventListener("click", () => { const next = !setup.every((node) => node.open); setup.forEach((node) => { node.open = next; }); sync(); });
  setup.forEach((node) => node.addEventListener("toggle", sync)); sync();
  const search = document.getElementById("search");
  const notes = Array.from(document.querySelectorAll("[data-note]"));
  document.getElementById("search-label").hidden = false;
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase(); let visible = 0;
    for (const note of notes) { const match = note.textContent.toLowerCase().includes(query); note.hidden = !match; if (match) visible++; }
    document.getElementById("filter-status").textContent = query ? `${visible} of ${notes.length} notes match.` : "";
  });
})();
