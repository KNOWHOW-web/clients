let currentPlatform = "";
let currentDay = 0;
let chart;
let activeClient = null;
let allPlatformsData = []; 
 
const apiURL = "https://script.google.com/macros/s/AKfycbykOtdU3vQT8L1FH36XsMMlUCW-rsLvtLS7-OTMFnlzDgRpDEvAzhdbjegQ-HsYe-xY/exec";
 
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientToken = urlParams.get('token');
    
    if (!clientToken) {
        alert("يرجى التأكد من الرابط.");
        return;
    }
 
    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        activeClient = data.clients.find(c => String(c.token) === String(clientToken));
 
        if (activeClient) {
            document.getElementById("mainBody").style.display = "block";
            document.getElementById("dashboardClientName").textContent = activeClient.client_name;
            if (activeClient.logo_url) {
                const img = document.getElementById("clientLogo");
                img.src = activeClient.logo_url;
                img.style.display = "block";
                document.getElementById("logoPlaceholder").style.display = "none";
            }
            allPlatformsData = data.platforms_data;
            calculateTotalDashboard();
        }
    } catch (e) { console.error("Error fetching data:", e); }
}
 
function calculateTotalDashboard() {
    const clientData = allPlatformsData.filter(d => String(d.client_id) === String(activeClient.client_id));
    const totals = clientData.reduce((acc, curr) => {
        acc.clicks += (Number(curr.clicks) || 0);
        acc.impressions += (Number(curr.impressions) || 0);
        acc.landing += (Number(curr.landing_page) || 0);
        acc.cost += (Number(curr.cost) || 0);
        return acc;
    }, { clicks: 0, impressions: 0, landing: 0, cost: 0 });
 
    document.getElementById("totalClicks").textContent = totals.clicks.toLocaleString();
    document.getElementById("totalImpressions").textContent = totals.impressions.toLocaleString();
    document.getElementById("totalLanding").textContent = totals.landing.toLocaleString();
    document.getElementById("totalCost").textContent = totals.cost.toLocaleString();
}
 
function openLayer(platform) {
    currentPlatform = platform;
    currentDay = 0;
    const iconMap = { 
        'TikTok': 'fab fa-tiktok', 'X': 'fab fa-x-twitter', 
        'Snapchat': 'fab fa-snapchat', 'LinkedIn': 'fab fa-linkedin-in', 
        'Instagram': 'fab fa-instagram', 'YouTube': 'fab fa-youtube' 
    };
    document.getElementById("layerIcon").className = iconMap[platform];
    document.getElementById("layer").classList.add("active");
    updateLayerData();
}
 
function closeLayer() { document.getElementById("layer").classList.remove("active"); }
 
function updateLayerData() {
    const platformData = allPlatformsData.filter(d => 
        String(d.client_id) === String(activeClient.client_id) && 
        d.platform.toLowerCase() === currentPlatform.toLowerCase()
    );
    if (platformData.length > 0) {
        const data = platformData[currentDay] || platformData[0];
        document.getElementById("dateText").innerText = data.date || "-- / --";
        renderChartAndTable(data);
    }
}
 
function renderChartAndTable(data) {
    const values = [Number(data.cost)||0, Number(data.impressions)||0, Number(data.clicks)||0, Number(data.landing_page)||0];
    document.getElementById("tableBody").innerHTML = `<tr><td>${values[0]}</td><td>${values[1]}</td><td>${values[2]}</td><td>${values[3]}</td></tr>`;
    
    const ctx = document.getElementById("chart").getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["التكلفة", "مرات الظهور", "النقرات", "زوار الصفحة"],
            datasets: [{ data: values, backgroundColor: "#EC6F54", borderRadius: 10 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}
 
function prevDay() { currentDay++; updateLayerData(); }
function nextDay() { if (currentDay > 0) { currentDay--; updateLayerData(); } }
init();
