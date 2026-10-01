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

  const user = parseJwt(response.credential);

  console.log("Google User:", user);

  const email = user.email;

  try {

    const res = await fetch(
      "/api/google_login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
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
  .getElementById("testLogin")
  ?.addEventListener("click", () => {

    sessionStorage.setItem(
      "demoLogin",
      "true"
    );

    window.location.href =
      "/management/management_screen.html";
  });