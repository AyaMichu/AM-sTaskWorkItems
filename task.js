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
