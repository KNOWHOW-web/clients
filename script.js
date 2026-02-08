let currentPlatform = "";
let currentDay = 0;
let chart;
let globalData = { clients: [], platforms_data: [] };
let filteredPlatformData = [];

const apiURL = "https://script.google.com/macros/s/AKfycbykOtdU3vQT8L1FH36XsMMlUCW-rsLvtLS7-OTMFnlzDgRpDEvAzhdbjegQ-HsYe-xY/exec";

const platformLogos = {
  TikTok: "images/tiktok.png",
  X: "images/x.png",
  Snapchat: "images/snapchat.png",
  LinkedIn: "images/linkedin.png",
  Instagram: "images/instagram.png",
  YouTube: "images/youtube.png"
};

async function fetchData() {
  try {
    const res = await fetch(apiURL);
    globalData = await res.json();

    const activeClient = globalData.clients.find(
      c => c.active === true || c.active === "TRUE"
    );

    if (activeClient) {
      updateUIForClient(activeClient);
      calculateGlobalTotals(activeClient.client_id);
    }
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  }
}

function updateUIForClient(client) {
  document.getElementById("clientSlogan").textContent = client.slogan || "نص الشعار هنا";
  document.getElementById("clientLogo").src = client.logo_url || "";
  document.getElementById("summaryClientName").textContent = client.client_name || "اسم العميل";
}

function calculateGlobalTotals(clientId) {
  const clientData = globalData.platforms_data.filter(
    d => String(d.client_id) === String(clientId)
  );

  let totals = { clicks: 0, impressions: 0, visitors: 0, cost: 0 };

  clientData.forEach(row => {
    totals.clicks += Number(row.clicks) || 0;
    totals.impressions += Number(row.impressions) || 0;
    totals.visitors += Number(row.landing_page) || 0;
    totals.cost += Number(row.cost) || 0;
  });

  document.getElementById("totalClicks").textContent = totals.clicks.toLocaleString();
  document.getElementById("totalImpressions").textContent = totals.impressions.toLocaleString();
  document.getElementById("totalVisitors").textContent = totals.visitors.toLocaleString();
  document.getElementById("totalCost").textContent = totals.cost.toLocaleString();
}

async function openLayer(platform) {
  currentPlatform = platform.toLowerCase();
  currentDay = 0;

  const activeClient = globalData.clients.find(
    c => c.active === true || c.active === "TRUE"
  );
  if (!activeClient) return;

  filteredPlatformData = globalData.platforms_data.filter(d =>
    String(d.client_id) === String(activeClient.client_id) &&
    d.platform.toLowerCase() === currentPlatform
  );

  filteredPlatformData.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("layer").classList.add("active");
  document.getElementById("platformLogo").src = platformLogos[platform];

  updateLayerData();
}

function updateLayerData() {
  if (filteredPlatformData.length > 0) {
    const data = filteredPlatformData[currentDay];
    const dateObj = new Date(data.date);
    const formattedDate = !isNaN(dateObj)
      ? dateObj.toLocaleDateString('en-GB')
      : data.date;

    document.getElementById("dateText").innerText = formattedDate;
    updateChartAndTable(data);
  } else {
    document.getElementById("dateText").innerText = "لا توجد بيانات";
    updateChartAndTable({ landing_page: 0, clicks: 0, impressions: 0, cost: 0 });
  }
}

function updateChartAndTable(data) {
  const landing = Number(data.landing_page) || 0;
  const clicks = Number(data.clicks) || 0;
  const impressions = Number(data.impressions) || 0;
  const cost = Number(data.cost) || 0;

  // تحديث محتوى الجدول (الرؤوس والبيانات معاً لضمان عدم المساس بالهيكل)
  document.getElementById("dataTable").innerHTML = `
    <thead>
      <tr>
        <th>زوار الصفحة</th>
        <th>النقرات</th>
        <th>مرات الظهور</th>
        <th>التكلفة</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${landing.toLocaleString()}</td>
        <td>${clicks.toLocaleString()}</td>
        <td>${impressions.toLocaleString()}</td>
        <td>${cost.toLocaleString()}</td>
      </tr>
    </tbody>
  `;

  // رسم المخطط البياني (يبقى كما هو لضمان الحجم)
  const ctx = document.getElementById("chart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["زوار الصفحة", "النقرات", "مرات الظهور", "التكلفة"],
      datasets: [{
        data: [landing, clicks, impressions, cost],
        backgroundColor: "rgba(236,111,84,0.7)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { color: "rgba(0,0,0,0.5)" } }
      }
    }
  });
}

function closeLayer() {
  document.getElementById("layer").classList.remove("active");
}

function prevDay() {
  if (currentDay < filteredPlatformData.length - 1) {
    currentDay++;
    updateLayerData();
  }
}

function nextDay() {
  if (currentDay > 0) {
    currentDay--;
    updateLayerData();
  }
}

fetchData();
