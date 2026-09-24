let reservationData = [];
let deleteMode = false;
let selectedIds = [];
// 初期ロード
async function loadReservations() {
    const res = await fetch("https://unafujireservation.vercel.app/api/reserve");
    reservationData = await res.json();

    // 日時順でカレンダー描画（古い → 新しい）(この関数内でrenderTableも呼ばれる)
    sortReservations(document.getElementById("sort-select").value);
}

// テーブル描画
function renderTable(data) {
    const tbody = document.querySelector("#reservation-table tbody");
    tbody.innerHTML = "";
    data.forEach(r => {
        // 日付と時間を日本語形式に変換
        const displayDate = new Date(r.date).toLocaleDateString("ja-JP");
        const displayCreatedAt = new Date(r.created_at).toLocaleString("ja-JP", {timeZone: "Asia/Tokyo"});

        const tr = document.createElement("tr");
        if (r.visited) {
            tr.classList.add("visited-row");
        } //visitedがtrueの場合に行にクラスを追加(灰色にするため)
        tr.innerHTML = `
            ${
                deleteMode
                    ? `
                    <td>
                        <input
                            type="checkbox"
                            class="delete-check"
                            data-id="${r.id}"
                            ${
                                selectedIds.includes(r.id)
                                    ? "checked"
                                    : ""
                            }
                        >
                    </td>
                    `
                    : ""
            }
            <td>
                ${
                    deleteMode
                        ? ""
                        : `
                        <button
                            class="visited-btn"
                            onclick="markVisited(${r.id}, ${r.visited})"
                        >
                            ${
                                r.visited
                                    ? "来店取消"
                                    : "来店"
                            }
                        </button>
                        `
                }
            </td>

            <td>${r.name}</td>
            <td>${r.people}</td>
            <td>${displayDate}</td>
            <td>${r.time}</td>
            <td>${r.phone}</td>
            <td>${displayCreatedAt}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("select-header").style.display =
        deleteMode ? "" : "none";

    document
        .querySelectorAll(".delete-check")
        .forEach((checkbox) => {

            checkbox.addEventListener(
                "change",
                (e) => {

                    const id =
                        Number(
                            e.target.dataset.id
                        );

                    if (e.target.checked) {

                        if (
                            !selectedIds.includes(id)
                        ) {
                            selectedIds.push(id);
                        }

                    } else {

                        selectedIds =
                            selectedIds.filter(
                                x => x !== id
                            );

                    }

                    document.getElementById(
                        "delete-selected-btn"
                    ).textContent =
                        `${selectedIds.length}件削除`;
                }
            );
        });
}

async function markVisited(id, visited) {
    const message = visited
        ? "来店済みを取り消しますか？"
        : "来店済みにしますか？";
    if (!confirm(message)) {
        return;
    }
    try {
        const res = await fetch(
            `https://unafujireservation.vercel.app/api/reserve`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id,
                    visited: !visited
                })
            }
        );
        if (!res.ok) {
            throw new Error("更新失敗");
        }
        alert(
            visited
                ? "来店済みを取り消しました"
                : "来店済みにしました"
        );
        // 一覧再読み込み
        await loadReservations();

    } catch (err) {
        console.error(err);
        alert("更新に失敗しました");
    }
}

// 並べ替え処理
document.getElementById("sort-select").addEventListener("change", (e) => {
    const key = e.target.value;
    sortReservations(key);
});

function sortReservations(key) {
    const sorted = [...reservationData];

    sorted.sort((a, b) => {
        if (!a.visited && b.visited) return -1;
        if (a.visited && !b.visited) return 1;

        if (key === "created_at") {
            // 予約完了日時順（新しい → 古い）
            const adt = new Date(a.created_at);
            const bdt = new Date(b.created_at);
            return bdt - adt;  // 降順
        }

        if (key === "datetime") {
            // 日付 + 時間で並べる（古い → 新しい）
            const adt = new Date(`${a.date}T${a.time}`);
            const bdt = new Date(`${b.date}T${b.time}`);

            // ★ Dateが無効なら絶対に文字列比較にしない
            if (isNaN(adt) || isNaN(bdt)) {
                const aNum = Number(a.date.replace(/-/g, "")) * 10000 + Number(a.time.replace(":", ""));
                const bNum = Number(b.date.replace(/-/g, "")) * 10000 + Number(b.time.replace(":", ""));
                return aNum - bNum;  // 昇順
            }

            return adt - bdt;  // 昇順（古い → 新しい）
        }
        return 0;
    });

    renderTable(sorted);
}




/////////実行!!!////////////
///////////////////////////
///////////////////////////
// プルダウンの最初の表示を日時順にする
document.getElementById("sort-select").value = "datetime";
// 初期実行
loadReservations();

//////以下イベントハンドラ//////   
//////////////////////////////

// 削除モードON
document
.getElementById("delete-mode-btn")
.addEventListener("click", () => {

    deleteMode = true;
    selectedIds = [];

    document.getElementById(
        "delete-mode-btn"
    ).style.display = "none";

    document.getElementById(
        "cancel-delete-btn"
    ).style.display = "inline-block";

    document.getElementById(
        "delete-selected-btn"
    ).style.display = "inline-block";

    sortReservations(
    document.getElementById("sort-select").value
    );
});

// 削除モードOFF
// キャンセル
document
.getElementById("cancel-delete-btn")
.addEventListener("click", () => {

    // 削除モード解除
    deleteMode = false;

    // チェック状態リセット
    selectedIds = [];

    // ボタン表示を元に戻す
    document.getElementById(
        "delete-mode-btn"
    ).style.display = "inline-block";

    document.getElementById(
        "cancel-delete-btn"
    ).style.display = "none";

    document.getElementById(
        "delete-selected-btn"
    ).style.display = "none";

    document.getElementById(
        "delete-selected-btn"
    ).textContent = "0件削除";

    // テーブルを再描画
    sortReservations(
        document.getElementById("sort-select").value
    );
});

// 選択した予約を削除
document
    .getElementById("delete-selected-btn")
    .addEventListener("click", async () => {

        if (selectedIds.length === 0) {
            alert("削除する予約を選択してください");
            return;
        }

        const ok = confirm(
            `${selectedIds.length}件削除しますか？`
        );

        if (!ok) {
            return;
        }

        try {
            const res = await fetch(
                "https://unafujireservation.vercel.app/api/reserve",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ids: selectedIds
                    })
                }
            );

            if (!res.ok) {
                throw new Error("削除失敗");
            }

            alert(`${selectedIds.length}件削除しました`);

            // 状態リセット
            deleteMode = false;
            selectedIds = [];

            document.getElementById(
                "delete-mode-btn"
            ).style.display = "inline-block";

            document.getElementById(
                "cancel-delete-btn"
            ).style.display = "none";

            document.getElementById(
                "delete-selected-btn"
            ).style.display = "none";

            document.getElementById(
                "delete-selected-btn"
            ).textContent = "0件削除";

            // 再読込
            await loadReservations();

        } catch (err) {
            console.error(err);
            alert("削除に失敗しました");
        }
    });