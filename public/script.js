document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("createBtn");
  const result = document.getElementById("result");

  button.addEventListener("click", async () => {
    const content = document.getElementById("content").value.trim();
    const ttl = document.getElementById("ttl").value;
    const views = document.getElementById("views").value;

    if (!content) {
      result.innerHTML = `<span style="color:#f87171">Content cannot be empty</span>`;
      return;
    }

    button.textContent = "Creating...";
    button.disabled = true;

    try {
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          ttl_seconds: ttl ? Number(ttl) : undefined,
          max_views: views ? Number(views) : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        result.innerHTML = `<span style="color:#f87171">${data.error}</span>`;
      } else {
        result.innerHTML = `
          ✅ Paste Created<br><br>
          <a href="${data.url}" target="_blank">${data.url}</a><br><br>
          <button id="copyBtn">📋 Copy Link</button>
        `;

        document.getElementById("copyBtn").addEventListener("click", () => {
          navigator.clipboard.writeText(data.url);
          alert("Link copied!");
        });
      }

    } catch {
      result.innerHTML = `<span style="color:#f87171">Server error</span>`;
    }

    button.textContent = "🚀 Create Paste";
    button.disabled = false;
  });
});
