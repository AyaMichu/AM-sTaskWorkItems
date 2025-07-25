const GAS_BASE_URL = "https://script.google.com/macros/s/AKfycbz7nmN4l_dEjVexTM9QAOe4QWUee2FCsxvAGcv5hRmWFPuEd4BBTLH8Oof-ys5yBs6b/exec";

let users = [];
let tasks = [];

const statusColors = {
  新規: "#2196f3",     // 青
  着手中: "#ff9800",   // オレンジ
  待機: "#9e9e9e",     // グレー
  完了: "#4caf50"      // 緑
};

async function fetchSheetFromGAS(mode) {
  const res = await fetch(`${GAS_BASE_URL}?mode=${mode}`);
  const json = await res.json();
  return json;
}

function getQuery(key) {
  const url = new URL(location.href);
  return url.searchParams.get(key);
}

function login() {
  const id = document.getElementById("userId").value.trim();
  const match = users.find(row => row[1]?.trim() === id);

  if (match) {
    const name = match[2];
    location.href = `home.html?userId=${encodeURIComponent(id)}&userName=${encodeURIComponent(name)}`;
  } else {
    document.getElementById("error").textContent = "ユーザIDが違います";
  }
}

function renderHome(userId) {
  const user = users.find(u => u[1] === userId);
  document.getElementById("welcome").textContent = `${user?.[2] ?? "ゲスト"}さん、ようこそ！`;

  let statusCount = { 新規: 0, 着手中: 0, 待機: 0, 完了: 0 };
  let totalIssued = 0, assignedCount = 0;

  tasks.forEach(row => {
    const issuer = row[1];
    const assignee = row[10];
    const status = row[11];

    if (issuer === userId) {
      totalIssued++;
      if (statusCount.hasOwnProperty(status)) statusCount[status]++;
    }
    if (assignee === userId) assignedCount++;
  });

  document.getElementById("assigned-count").textContent = `${assignedCount} 件`;

  const container = document.getElementById("progress-bars");
  container.innerHTML = "";

  ["新規", "着手中", "待機", "完了"].forEach(key => {
    const percent = totalIssued ? Math.round((statusCount[key] / totalIssued) * 100) : 0;
    container.innerHTML += `
      <div>
        ${key} (${percent}%)
        <div style="background:#eee; width:300px">
          <div style="background:${statusColors[key]}; width:${percent}%; color:white; padding:2px">
            ${percent}%
          </div>
        </div>
      </div>`;
  });

  document.getElementById("listLink").href = `list.html?userId=${encodeURIComponent(userId)}`;
}

function renderList(userId) {
  const table = document.getElementById("taskTable");
  const idToName = Object.fromEntries(users.map(u => [u[1], u[2]]));
  table.innerHTML = `
    <tr><th>ID</th><th>発行者</th><th>タイトル</th><th>担当者</th><th>ステータス</th>
    <th>開始予定</th><th>完了予定</th><th>開始日</th><th>完了日</th></tr>`;

  tasks.forEach(row => {
    const id = row[0], issuer = row[1], title = row[3], assignee = row[10], status = row[11];
    const startPlan = row[12], endPlan = row[13], startDate = row[14], endDate = row[15];

    if (issuer !== userId && assignee !== userId) return;

    table.innerHTML += `
      <tr>
        <td>${id}</td>
        <td>${idToName[issuer] || issuer}</td>
        <td><a href="#">${title}</a></td>
        <td>${idToName[assignee] || assignee}</td>
        <td>${status}</td>
        <td>${startPlan}</td>
        <td>${endPlan}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
      </tr>`;
  });
}

window.onload = async () => {
  const page = location.pathname.split("/").pop();
  const userId = getQuery("userId");

  users = await fetchSheetFromGAS("users");

  if (page === "index.html") return;

  tasks = await fetchSheetFromGAS("tasks");

  if (page === "home.html") {
    renderHome(userId);
  } else if (page === "list.html") {
    renderList(userId);
  }
};
