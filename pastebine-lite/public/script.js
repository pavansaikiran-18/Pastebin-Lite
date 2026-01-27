async function createPaste() {
  const content = document.getElementById("content").value;
  const ttl = document.getElementById("ttl").value;
  const views = document.getElementById("views").value;
  const result = document.getElementById("result");

  if (!content.trim()) {
    result.innerText = "Content cannot be empty!";
    return;
  }

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
    result.innerText = "Error: " + data.error;
    return;
  }

  result.innerHTML = `Paste Created:<br><a href="${data.url}" target="_blank">${data.url}</a>`;
}
