let currentPlatform = "";
let currentDay = 0;
let chart;
let activeClient = null;
let dataSet = {};

// ضع هنا رابط الـ API الخاص بك (Google Sheets Apps Script)
const apiURL = "رابط_الـ_WEB_APP_الخاص_بك";

// الحصول على التوكن من الرابط
const urlParams = new URLSearchParams(window.location.search);
const clientToken = urlParams.get('token');

async function init() {
    if (!clientToken) {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>عذراً، الرابط غير صحيح (Token Missing)</h1>";
        return;
    }
    await fetchAppData();
}

async function fetchAppData() {
    try {
        const res = await fetch(apiURL);
        const allSheetsData = await res.json(); // نفترض أن الـ API يرجع كل الشيتات

        // 1. العثور على العميل بناءً على التوكن
        activeClient = allSheetsData.clients.find(c => c.token === clientToken);

        if (activeClient) {
            // تحديث الشعار والنص
            if (activeClient.slogan) {
                document.getElementById("clientSlogan").textContent = activeClient.slogan;
            }
            if (activeClient.logo_url) {
                const logoImg = document.getElementById("clientLogo");
                logoImg.src = activeClient.logo_url;
                logoImg.style.display = "block";
            }
            // اسم العميل لك (شفاف)
            document.getElementById("adminClientName").textContent = "العميل: " + activeClient.client_name;
            
            // تخزين بيانات المنصات
            dataSet = allSheetsData.platforms_data; 
        }
    } catch (e) {
        console.error("خطأ في جلب البيانات", e);
    }
}

async function openLayer(platform) {
    currentPlatform = platform;
    currentDay = 0;
    document.getElementById("layer").classList.add("active");
    
    // تحديث شعار المنصة في الطبقة المنبثقة
    const platformIcons = {
        TikTok: "images/tiktok.png", X: "images/x.png", Snapchat: "images/snapchat.png",
        LinkedIn: "images/linkedin.png", Instagram: "images/instagram.png", YouTube: "images/youtube.png"
    };
    document.getElementById("platformLogo").src = platformIcons[platform];

    updateData();
}

function updateData() {
    // فلترة البيانات للعميل الحالي والمنصة المختارة
    const platformData = dataSet.filter(d => d.client_id == activeClient.client_id && d.platform.toLowerCase() == currentPlatform.toLowerCase());

    if (platformData.length > 0) {
        const data = platformData[currentDay];
        document.getElementById("dateText").innerText = data.date || "--/--";
        updateChartAndTable(data);
    } else {
        document.getElementById("dateText").innerText = "-- / --";
        updateChartAndTable({ landing_page: 0, clicks: 0, impressions: 0, cost: 0 });
    }
}

function updateChartAndTable(data) {
    const values = [data.landing_page || 0, data.clicks || 0, data.impressions || 0, data.cost || 0];

    // تحديث الجدول
    document.getElementById("tableBody").innerHTML = `
        <tr>
          <td>${values[0]}</td>
          <td>${values[1]}</td>
          <td>${values[2]}</td>
          <td>${values[3]}</td>
        </tr>`;

    // تحديث الرسم البياني
    const ctx = document.getElementById("chart").getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["زوار الصفحة", "النقرات", "مرات الظهور", "التكلفة"],
            datasets: [{
                data: values,
                backgroundColor: "rgba(236,111,84,0.8)",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { ticks: { color: '#333' } }
            }
        }
    });
}

function closeLayer() { document.getElementById("layer").classList.remove("active"); }
function prevDay() { /* منطق التنقل بين الأيام */ currentDay++; updateData(); }
function nextDay() { if (currentDay > 0) { currentDay--; updateData(); } }

init();
