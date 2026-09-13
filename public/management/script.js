let reservationData = []; // 取得したデータを保持

// 初期ロード
async function loadReservations() {
    const res = await fetch("https://unafujireservation.vercel.app/api/reserve");
   // ← Vercel API に変更
    reservationData = await res.json();
    renderTable(reservationData);

    // ▼ デフォルトを日時順にする（古い → 新しい）
    sortReservations("datetime");
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
        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${r.people}</td>
            <td>${displayDate}</td>
            <td>${r.time}</td>
            <td>${r.phone}</td>
            <td>${displayCreatedAt}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 並べ替え処理
document.getElementById("sort-select").addEventListener("change", (e) => {
    const key = e.target.value;
    sortReservations(key);
});

function sortReservations(key) {
    const sorted = [...reservationData];

    sorted.sort((a, b) => {

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

    });

    renderTable(sorted);
}

// 初期実行
loadReservations();

// ▼ デフォルトを日時順にする
document.getElementById("sort-select").value = "datetime";
sortReservations("datetime");