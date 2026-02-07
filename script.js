let currentPlatform = "";
let currentDay = 0;
let chart;

// REPLACE THIS with your "Published to Web" CSV link from Google Sheets
const apiURL = "https://script.google.com/macros/s/AKfycbykOtdU3vQT8L1FH36XsMMlUCW-rsLvtLS7-OTMFnlzDgRpDEvAzhdbjegQ-HsYe-xY/exec";

const platformLogos = {
  TikTok:"images/tiktok.png",
  X:"images/x.png",
  Snapchat:"images/snapchat.png",
  LinkedIn:"images/linkedin.png",
  Instagram:"images/instagram.png",
  YouTube:"images/youtube.png"
};

let clientsData = [];
let dataSet = {};

function csvToArray(str, delimiter = ",") {
  const lines = str.split("\n");
  const headers = lines[0].split(delimiter).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(delimiter);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : "");
    return obj;
  });
}

async function fetchClients() {
  try {
    const res = await fetch(apiURL);
    const text = await res.text();
    clientsData = csvToArray(text);

    const activeClient = clientsData.find(c => c.active === "TRUE");
    if(activeClient){
      document.getElementById("clientSlogan").textContent = activeClient.slogan || "نص الشعار هنا";
      document.getElementById("clientLogo").src = activeClient.logo_url;
      document.getElementById("summaryClientName").textContent = activeClient.client_name || "اسم العميل";
      
      // Update Global Dashboard
      updateGlobalDashboard(activeClient.client_id);
    }
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

function updateGlobalDashboard(clientId) {
  let totals = { clicks: 0, impressions: 0, visitors: 0, cost: 0 };

  clientsData.forEach(row => {
    if(row.client_id === clientId) {
      totals.clicks += Number(row.clicks) || 0;
      totals.impressions += Number(row.impressions) || 0;
      totals.visitors += Number(row.landing_page) || 0;
      totals.cost += Number(row.cost) || 0;
    }
  });

  document.getElementById("totalClicks").textContent = totals.clicks.toLocaleString();
  document.getElementById("totalImpressions").textContent = totals.impressions.toLocaleString();
  document.getElementById("totalVisitors").textContent = totals.visitors.toLocaleString();
  document.getElementById("totalCost").textContent = totals.cost.toLocaleString();
}

async function openLayer(platform){
  currentPlatform = platform;
  currentDay = 0;
  document.getElementById("layer").classList.add("active");
  document.getElementById("platformLogo").src = platformLogos[platform];

  const activeClient = clientsData.find(c => c.active === "TRUE");
  const clientData = clientsData.filter(d => d.client_id === activeClient.client_id && d.platform === platform);

  dataSet[platform] = clientData.map(d => ({
    landing: Number(d.landing_page) || 0,
    clicks: Number(d.clicks) || 0,
    impressions: Number(d.impressions) || 0,
    cost: Number(d.cost) || 0,
    date: d.date
  }));

  updateData();
}

function updateData(){
  const platformData = dataSet[currentPlatform] || [];
  if(platformData.length > 0){
    const data = platformData[currentDay];
    document.getElementById("dateText").innerText = data.date || "--/--";
    updateChartAndTable(data);
  } else {
    document.getElementById("dateText").innerText = "-- / --";
    updateChartAndTable({landing: 0, clicks: 0, impressions: 0, cost: 0});
  }
}

function updateChartAndTable(data) {
  const landing = data.landing || 0;
  const clicks = data.clicks || 0;
  const impressions = data.impressions || 0;
  const cost = data.cost || 0;

  document.getElementById("dataTable").innerHTML = `
    <tr>
      <th>زوار الصفحة</th>
      <th>النقرات</th>
      <th>مرات الظهور</th>
      <th>التكلفة</th>
    </tr>
    <tr>
      <td>${landing}</td>
      <td>${clicks}</td>
      <td>${impressions}</td>
      <td>${cost}</td>
    </tr>
  `;

  const ctx = document.getElementById("chart").getContext('2d');
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["زوار الصفحة","النقرات","مرات الظهور","التكلفة"],
      datasets: [{
        label: "البيانات اليومية",
        data: [landing, clicks, impressions, cost],
        backgroundColor: "rgba(236,111,84,0.5)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { color: 'rgba(0,0,0,0.5)' } }
      }
    }
  });
}

function closeLayer(){ document.getElementById("layer").classList.remove("active"); }
function prevDay(){ const max = (dataSet[currentPlatform]?.length || 1) - 1; if(currentDay < max){currentDay++; updateData();} }
function nextDay(){ if(currentDay > 0){currentDay--; updateData();} }

fetchClients();
