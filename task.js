const USER_RANGE = "01_ユーザ!A2:C";
const TASK_RANGE = "02_ワークアイテム!A2:AJ"; // 必要列範囲に調整

let users = [];
let tasks = [];

const GAS_BASE_URL = "https://script.google.com/macros/s/AKfycbz7nmN4l_dEjVexTM9QAOe4QWUee2FCsxvAGcv5hRmWFPuEd4BBTLH8Oof-ys5yBs6b/exec"; // 公開URL

function fetchSheetFromGAS(mode) {
  return fetch(`${GAS_BASE_URL}?mode=${mode}`)
    .then(res => res.json())
    .then(data => data);
}

window.onload = async () => {
  if (location.pathname.endsWith("index.html")) {
    users = await fetchSheetFromGAS("users");
  } else if (location.pathname.endsWith("home.html")) {
    const userId = getQuery("userId");
    users = await fetchSheetFromGAS("users");
    tasks = await fetchSheetFromGAS("tasks");
    renderHome(userId);
  } else if (location.pathname.endsWith("list.html")) {
    const userId = getQuery("userId");
    users = await fetchSheetFromGAS("users");
    tasks = await fetchSheetFromGAS("tasks");
    renderList(userId);
  }
};

function fetchSheet(range) {
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`)
    .then(res => res.json())
    .then(data => data.values);
}

function login() {
  const id = document.getElementById("userId").value.trim();
  const match = users.find(row => row[1].trim() === id.trim());
  console.log("入力ID:", id);
  
  if (match) {
    const name = match[2];
    location.href = `home.html?userId=${encodeURIComponent(id)}&userName=${encodeURIComponent(name)}`;
  } else {
    document.getElementById("error").textContent = "ユーザIDが違います";
  }
}

function renderHome(userId) {
  const user = users.find(u => u[1] === userId);
  document.getElementById("welcome").textContent = `${user[2]}さん、ようこそ！`;

  let statusCount = { 新規: 0, 着手中: 0, 待機: 0, 完了: 0 };
  let totalIssued = 0, assigned = 0;

  tasks.forEach(task => {
    const issuer = task[1];
    const assignee = task[10];
    const status = task[11];
    if (issuer === userId) {
      totalIssued++;
      if (statusCount[status] != null) statusCount[status]++;
    }
    if (assignee === userId) assigned++;
  });

  document.getElementById("assigned-count").textContent = `${assigned} 件`;

  let container = document.getElementById("progress-bars");
  ["新規", "着手中", "待機", "完了"].forEach(key => {
    let percent = totalIssued ? Math.round((statusCount[key] / totalIssued) * 100) : 0;
    container.innerHTML += `
      <div>
        ${key} (${percent}%)
        <div style="background:#eee; width:300px">
          <div style="background:#4caf50; width:${percent}%; color:white">${percent}%</div>
        </div>
      </div>`;
  });

  const listLink = document.getElementById("listLink");
  listLink.href = `list.html?userId=${encodeURIComponent(userId)}`;
}

function renderList(userId) {
  const taskTable = document.getElementById("taskTable");
  const header = `
    <tr><th>ID</th><th>発行者</th><th>タイトル</th><th>担当者</th><th>ステータス</th>
    <th>開始予定</th><th>完了予定</th><th>開始日</th><th>完了日</th></tr>`;
  taskTable.innerHTML = header;

  const idToName = Object.fromEntries(users.map(u => [u[1], u[2]]));

  tasks.forEach(row => {
    const id = row[0], issuer = row[1], title = row[3], assignee = row[10], status = row[11];
    const startPlan = row[12], endPlan = row[13], startDate = row[14], endDate = row[15];

    if (issuer !== userId && assignee !== userId) return;

    taskTable.innerHTML += `
      <tr>
        <td>${id}</td><td>${idToName[issuer] || issuer}</td>
        <td><a href="#">${title}</a></td>
        <td>${idToName[assignee] || assignee}</td>
        <td>${status}</td>
        <td>${startPlan}</td><td>${endPlan}</td><td>${startDate}</td><td>${endDate}</td>
      </tr>`;
  });
}

function getQuery(key) {
  const url = new URL(location.href);
  return url.searchParams.get(key);
}
