const GAS_BASE_URL = "https://script.google.com/macros/s/AKfycbzfRqQ9IuRMT5FuKLNM-_WHchaWtkploYEGKjX3DuSQ_GJ__TiwmJTIfrSSZzN92iKt/exec";

let users = [];
let tasks = [];

const statusColors = {
  新規: "#2196f3",
  着手中: "#ff9800",
  待機: "#9e9e9e",
  完了: "#4caf50"
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

function formatDate(str) {
  if (!str || str.length < 8) return "";
  const date = new Date(str);
  if (isNaN(date)) return str;
  return `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,"0")}/${date.getDate().toString().padStart(2,"0")}`;
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
    const startPlan = formatDate(row[12]), endPlan = formatDate(row[13]);
    const startDate = formatDate(row[14]), endDate = formatDate(row[15]);

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

document.addEventListener("DOMContentLoaded", async () => {
  const page = location.pathname.split("/").pop();
  const userId = getQuery("userId");

  if (page === "index.html") {
    users = await fetchSheetFromGAS("users");
    document.getElementById("userId").disabled = false;
    document.getElementById("userId").placeholder = "ユーザIDを入力してください";
    document.getElementById("loginBtn").disabled = false;
    document.getElementById("loginBtn").addEventListener("click", login);
    return;
  }

  users = await fetchSheetFromGAS("users");
  tasks = await fetchSheetFromGAS("tasks");

  if (page === "home.html") {
    renderHome(userId);
  } else if (page === "list.html") {
    renderList(userId);
  }
});
