function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  return JSON.parse(
    decodeURIComponent(
      atob(base64)
        .split("")
        .map(
          c =>
            "%" +
            ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    )
  );
}

async function handleCredentialResponse(response) {

  try {

    const res = await fetch(
      "/api/google_login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idToken: response.credential
        })
      }
    );

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "ログイン失敗");
      return;
    }

    window.location.href =
      "/management/management_screen.html";

  } catch (err) {
        console.error(err);
        alert(err.message || JSON.stringify(err));
    }
}

window.handleCredentialResponse =
  handleCredentialResponse;

document
.getElementById("testLoginYakitori")
?.addEventListener("click", async () => {

  const res = await fetch(
    "/api/demo_login",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        managementId: 1
      })
    }
  );

  if (!res.ok) {
    alert("ログイン失敗");
    return;
  }

  location.href =
    "/management/management_screen.html";
});

document
.getElementById("testLoginYakiniku")
?.addEventListener("click", async () => {

  const res = await fetch(
    "/api/demo_login",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        managementId: 2
      })
    }
  );

  if (!res.ok) {
    alert("ログイン失敗");
    return;
  }

  location.href =
    "/management/management_screen.html";
});