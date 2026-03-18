let statusChartInstance;
let ordersTrendChartInstance;

function getOrders() {
  return JSON.parse(localStorage.getItem("orders")) || [];
}

function getFilteredOrders() {
  const orders = getOrders();
  const filter = document.getElementById("dateFilter");

  if (!filter) return orders;

  const value = filter.value;
  if (value === "all") return orders;

  if (value === "today") {
  const today = new Date().toISOString().split("T")[0];

  return orders.filter(order =>
    order.orderDate &&
    new Date(order.orderDate).toISOString().split("T")[0] === today
  );
}

  const days = Number(value);
  const now = new Date();

  return orders.filter(order => {
    if (!order.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    const diffTime = now - orderDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  });
}

function getStatusClass(status) {
  if (status === "Pending") return "pending";
  if (status === "In progress") return "progress";
  return "completed";
}

function getConfiguredTableColumns() {
  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];
  const tableWidget = saved.find(widget => widget.widgetType === "table");

  if (!tableWidget || !tableWidget.columns || !tableWidget.columns.length) {
    return ["customerName", "product", "status", "totalAmount", "orderDate"];
  }

  return tableWidget.columns;
}

function getConfiguredKPIMetrics() {
  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];
  const kpiWidgets = saved.filter(widget => widget.widgetType === "kpi");

  if (!kpiWidgets.length) {
    return ["orders", "revenue", "customers"];
  }

  return kpiWidgets.map(widget => widget.metric || "orders");
}

function getConfiguredChartType() {
  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];
  const chartWidget = saved.find(widget => widget.widgetType === "chart");

  if (!chartWidget || !chartWidget.chartType) {
    return "line";
  }

  return chartWidget.chartType;
}

function loadRecentOrders(orders) {
  const tableBody = document.getElementById("recentOrdersBody");
  const tableHeadRow = document.querySelector(".orders-table thead tr");

  if (!tableBody || !tableHeadRow) return;

  const selectedColumns = getConfiguredTableColumns();

  const columnMap = {
    customerName: "Customer",
    email: "Email",
    product: "Product",
    quantity: "Quantity",
    totalAmount: "Amount",
    status: "Status",
    orderDate: "Date"
  };

  tableHeadRow.innerHTML = "";
  selectedColumns.forEach(col => {
    if (columnMap[col]) {
      tableHeadRow.innerHTML += `<th>${columnMap[col]}</th>`;
    }
  });

  tableBody.innerHTML = "";

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="${selectedColumns.length}" style="text-align:center; color:#64748b;">
          No recent orders
        </td>
      </tr>
    `;
    return;
  }

  const recentOrders = orders.slice().reverse().slice(0, 5);

  recentOrders.forEach(order => {
    let row = "<tr>";

    selectedColumns.forEach(col => {
      if (col === "status") {
        row += `<td><span class="status ${getStatusClass(order.status)}">${order.status || "-"}</span></td>`;
      } else if (col === "orderDate") {
        row += `<td>${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</td>`;
      } else {
        row += `<td>${order[col] ?? "-"}</td>`;
      }
    });

    row += "</tr>";
    tableBody.innerHTML += row;
  });
}

function loadStatusChart(orders) {
  const pending = orders.filter(order => order.status === "Pending").length;
  const progress = orders.filter(order => order.status === "In progress").length;
  const completed = orders.filter(order => order.status === "Completed").length;

  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  if (statusChartInstance) {
    statusChartInstance.destroy();
  }

  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "In Progress", "Completed"],
      datasets: [{
        data: [pending, progress, completed],
        backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 18,
            font: {
              size: 12,
              weight: "600"
            }
          }
        }
      }
    }
  });
}

function loadOrdersTrendChart(orders) {
  const ctx = document.getElementById("ordersChart");
  if (!ctx) return;

  const filter = document.getElementById("dateFilter");
  const filterValue = filter ? filter.value : "7";

  let labels = [];
  let values = [];

  if (filterValue === "7") {
    labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
    values = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();

    orders.forEach(order => {
      if (!order.orderDate) return;
      const orderDate = new Date(order.orderDate);
      const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        const index = 6 - diffDays;
        values[index]++;
      }
    });

  } else if (filterValue === "30") {
    labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    values = [0, 0, 0, 0];

    const now = new Date();

    orders.forEach(order => {
      if (!order.orderDate) return;
      const orderDate = new Date(order.orderDate);
      const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 30) {
        const weekIndex = Math.min(3, Math.floor(diffDays / 7));
        values[3 - weekIndex]++;
      }
    });

  } else if (filterValue === "90" || filterValue === "all") {
    const monthlyData = {};

    orders.forEach(order => {
      if (!order.orderDate) return;
      const date = new Date(order.orderDate);
      const monthLabel = date.toLocaleString("en-US", { month: "short" });
      monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + 1;
    });

    labels = Object.keys(monthlyData);
    values = Object.values(monthlyData);
  }

  const selectedChartType = getConfiguredChartType();

  if (ordersTrendChartInstance) {
    ordersTrendChartInstance.destroy();
  }

  const color = "#6366f1";

  ordersTrendChartInstance = new Chart(ctx, {
    type: selectedChartType === "pie" ? "doughnut" :
          selectedChartType === "bar" ? "bar" :
          selectedChartType === "scatter" ? "scatter" :
          selectedChartType === "area" ? "line" :
          "line",
    data: {
      labels: selectedChartType === "scatter" ? [] : labels,
      datasets: [{
        label: "Orders",
        data: selectedChartType === "scatter"
          ? values.map((v, i) => ({ x: i + 1, y: v }))
          : values,
        borderColor: color,
        backgroundColor: color + "33",
        fill: selectedChartType === "area",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: color
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function applyConfiguredKPIs() {
  const metrics = getConfiguredKPIMetrics();

  const ordersCard = document.getElementById("ordersCard");
  const revenueCard = document.getElementById("revenueCard");
  const customersCard = document.getElementById("customersCard");

  if (ordersCard) ordersCard.style.display = metrics.includes("orders") ? "block" : "none";
  if (revenueCard) revenueCard.style.display = metrics.includes("revenue") ? "block" : "none";
  if (customersCard) customersCard.style.display = metrics.includes("customers") ? "block" : "none";
}

function applyConfiguredWidgetTitles() {
  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];

  const chartWidgets = saved.filter(widget => widget.widgetType === "chart");
  const tableWidget = saved.find(widget => widget.widgetType === "table");

  const trendChartTitle = document.getElementById("trendChartTitle");
  const statusChartTitle = document.getElementById("statusChartTitle");
  const recentOrdersTitle = document.getElementById("recentOrdersTitle");

  if (chartWidgets.length > 0 && trendChartTitle) {
    trendChartTitle.innerText = chartWidgets[0].title || "Orders Trend";
  } else if (trendChartTitle) {
    trendChartTitle.innerText = "Orders Trend";
  }

  if (chartWidgets.length > 1 && statusChartTitle) {
    statusChartTitle.innerText = chartWidgets[1].title || "Orders by Status";
  } else if (statusChartTitle) {
    statusChartTitle.innerText = "Orders by Status";
  }

  if (tableWidget && recentOrdersTitle) {
    recentOrdersTitle.innerText = tableWidget.title || "Recent Orders";
  } else if (recentOrdersTitle) {
    recentOrdersTitle.innerText = "Recent Orders";
  }
}

function loadConfiguredWidgetsPreview() {
  const container = document.getElementById("configuredWidgets");
  if (!container) return;

  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];
  container.innerHTML = "";

  if (!saved.length) {
    container.innerHTML = `<div class="widget-empty">No saved widget configuration yet.</div>`;
    return;
  }

  saved.forEach((widget, index) => {
    container.innerHTML += `
      <div class="config-preview-card">
        <h4>${widget.title || `Widget ${index + 1}`}</h4>
        <div class="config-preview-meta">
          <div><strong>Type:</strong> ${widget.widgetType || "unknown"}</div>
          <div><strong>Position:</strong> (${widget.x}, ${widget.y})</div>
          <div><strong>Size:</strong> ${widget.w} columns × ${widget.h} rows</div>
        </div>
      </div>
    `;
  });
}

function applyConfiguredWidgetVisibility() {
  const saved = JSON.parse(localStorage.getItem("dashboardConfigLayout")) || [];

  const kpiSection = document.getElementById("kpiSection");
  const chartSection = document.getElementById("chartSection");
  const tableSection = document.getElementById("tableSection");
  const emptyMsg = document.getElementById("emptyMsg");

  if (!kpiSection || !chartSection || !tableSection) return;

  kpiSection.classList.add("hidden");
  chartSection.classList.add("hidden");
  tableSection.classList.add("hidden");

  if (!saved.length) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  const hasKPI = saved.some(widget => widget.widgetType === "kpi");
  const hasChart = saved.some(widget => widget.widgetType === "chart");
  const hasTable = saved.some(widget => widget.widgetType === "table");

  if (hasKPI) kpiSection.classList.remove("hidden");
  if (hasChart) chartSection.classList.remove("hidden");
  if (hasTable) tableSection.classList.remove("hidden");
}

function loadDashboardData() {
  const loading = document.getElementById("loadingState");
  if (loading) loading.classList.remove("hidden");

  setTimeout(() => {
    const orders = getFilteredOrders();

    const totalOrders = orders.length;
    let totalRevenue = 0;
    const customerSet = new Set();

    orders.forEach(order => {
      const amount = Number(String(order.totalAmount || "0").replace("$", "")) || 0;
      totalRevenue += amount;
      if (order.customerName) customerSet.add(order.customerName);
    });

    const totalCustomers = customerSet.size;

    const totalOrdersEl = document.getElementById("totalOrders");
    const totalRevenueEl = document.getElementById("totalRevenue");
    const totalCustomersEl = document.getElementById("totalCustomers");

    if (totalOrdersEl) totalOrdersEl.innerText = totalOrders;
    if (totalRevenueEl) totalRevenueEl.innerText = "$" + totalRevenue.toFixed(2);
    if (totalCustomersEl) totalCustomersEl.innerText = totalCustomers;

    loadRecentOrders(orders);
    loadStatusChart(orders);
    loadOrdersTrendChart(orders);
    applyConfiguredKPIs();
    applyConfiguredWidgetTitles();

    if (loading) loading.classList.add("hidden");
  }, 300);
}

function setupSearch() {
  const searchInput = document.getElementById("orderSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase().trim();
    const orders = getFilteredOrders();

    const filteredOrders = orders.filter(order =>
      (order.customerName || "").toLowerCase().includes(searchText) ||
      (order.product || "").toLowerCase().includes(searchText) ||
      (order.status || "").toLowerCase().includes(searchText) ||
      String(order.totalAmount || "").toLowerCase().includes(searchText)
    );

    loadRecentOrders(filteredOrders);
    loadStatusChart(filteredOrders);
    loadOrdersTrendChart(filteredOrders);

    const totalOrdersEl = document.getElementById("totalOrders");
    const totalRevenueEl = document.getElementById("totalRevenue");
    const totalCustomersEl = document.getElementById("totalCustomers");

    let totalRevenue = 0;
    const customerSet = new Set();

    filteredOrders.forEach(order => {
      const amount = Number(String(order.totalAmount || "0").replace("$", "")) || 0;
      totalRevenue += amount;
      if (order.customerName) customerSet.add(order.customerName);
    });

    if (totalOrdersEl) totalOrdersEl.innerText = filteredOrders.length;
    if (totalRevenueEl) totalRevenueEl.innerText = "$" + totalRevenue.toFixed(2);
    if (totalCustomersEl) totalCustomersEl.innerText = customerSet.size;
  });
}

function setupDateFilter() {
  const filter = document.getElementById("dateFilter");
  if (!filter) return;

  filter.addEventListener("change", function () {
    const searchInput = document.getElementById("orderSearch");
    if (searchInput) searchInput.value = "";
    loadDashboardData();

    if(filter === "today"){
const today = new Date().toISOString().split("T")[0];

filteredOrders = orders.filter(o =>
new Date(o.orderDate).toISOString().split("T")[0] === today
  });
}

function resetDashboardLayout() {
  if (!confirm("Reset dashboard layout to default?")) return;

  localStorage.removeItem("dashboardConfigLayout");
  showToast("Dashboard restored to default", "info");

  setTimeout(() => {
    location.reload();
  }, 600);
}

function downloadChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    showToast("Chart not found", "error");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "dashboard-chart.png";
  link.click();

  showToast("Chart downloaded", "success");
}

function loadDemoData() {
  if (!confirm("Load demo sample orders?")) return;

  const demoOrders = [
    {
      customerId:"CUST-1001",
      orderId:"ORD-5001",
      customerName:"John Smith",
      firstName:"John",
      lastName:"Smith",
      email:"john@example.com",
      phone:"9876543210",
      product:"Fiber Internet 300 Mbps",
      quantity:1,
      unitPrice:120,
      totalAmount:"$120",
      status:"Completed",
      createdBy:"Mr. Michael Harris",
      orderDate:new Date().toISOString()
    },
    {
      customerId:"CUST-1002",
      orderId:"ORD-5002",
      customerName:"Sarah Lee",
      firstName:"Sarah",
      lastName:"Lee",
      email:"sarah@example.com",
      phone:"9876543211",
      product:"5GUnlimited Mobile Plan",
      quantity:2,
      unitPrice:85,
      totalAmount:"$170",
      status:"Pending",
      createdBy:"Ms. Olivia Carter",
      orderDate:new Date().toISOString()
    },
    {
      customerId:"CUST-1003",
      orderId:"ORD-5003",
      customerName:"David Chen",
      firstName:"David",
      lastName:"Chen",
      email:"david@example.com",
      phone:"9876543212",
      product:"Fiber Internet 1 Gbps",
      quantity:1,
      unitPrice:200,
      totalAmount:"$200",
      status:"Completed",
      createdBy:"Mr. Ryan Cooper",
      orderDate:new Date().toISOString()
    },
    {
      customerId:"CUST-1004",
      orderId:"ORD-5004",
      customerName:"Maria Lopez",
      firstName:"Maria",
      lastName:"Lopez",
      email:"maria@example.com",
      phone:"9876543213",
      product:"VoIP Corporate Package",
      quantity:3,
      unitPrice:90,
      totalAmount:"$270",
      status:"In progress",
      createdBy:"Mr. Lucas Martin",
      orderDate:new Date().toISOString()
    },
    {
      customerId:"CUST-1005",
      orderId:"ORD-5005",
      customerName:"Alex Brown",
      firstName:"Alex",
      lastName:"Brown",
      email:"alex@example.com",
      phone:"9876543214",
      product:"Business Internet 500 Mbps",
      quantity:2,
      unitPrice:150,
      totalAmount:"$300",
      status:"Completed",
      createdBy:"Mr. Michael Harris",
      orderDate:new Date().toISOString()
    }
  ];

  localStorage.setItem("orders", JSON.stringify(demoOrders));
  showToast("Demo data loaded", "success");

  setTimeout(() => {
    location.reload();
  }, 600);
}

function refreshDashboard() {
  applyConfiguredWidgetVisibility();
  loadDashboardData();
  loadConfiguredWidgetsPreview();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("dashboardTheme") || "light";
  const toggleBtn = document.getElementById("themeToggle");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (toggleBtn) toggleBtn.innerText = "☀️";
  } else {
    document.body.classList.remove("dark-mode");
    if (toggleBtn) toggleBtn.innerText = "🌙";
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("dashboardTheme", isDark ? "dark" : "light");
    toggleBtn.innerText = isDark ? "☀️" : "🌙";
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.className = "toast";
  toast.classList.add(type);
  toast.innerText = message;

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

window.addEventListener("focus", function () {
  refreshDashboard();
});

window.addEventListener("storage", function () {
  refreshDashboard();
});

window.addEventListener("DOMContentLoaded", function () {
  applySavedTheme();
  refreshDashboard();
  setupSearch();
  setupDateFilter();
  setupThemeToggle();
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem("dashboardTheme") || "light";
  const toggleBtn = document.getElementById("themeToggle");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    if (toggleBtn) toggleBtn.innerText = "☀️";
  } else {
    document.body.classList.remove("dark");
    if (toggleBtn) toggleBtn.innerText = "🌙";
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  toggleBtn.onclick = function () {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("dashboardTheme", isDark ? "dark" : "light");
    toggleBtn.innerText = isDark ? "☀️" : "🌙";
  };
}

window.addEventListener("DOMContentLoaded", function () {
  applySavedTheme();
  refreshDashboard();
  setupSearch();
  setupDateFilter();
  setupThemeToggle();
  setupProfileMenu();
});

function setupProfileMenu(){
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if(profileBtn && profileMenu){
    profileBtn.onclick = function(e){
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    };

    document.addEventListener("click", function(){
      profileMenu.classList.add("hidden");
    });
  }
}

function logout(){
  alert("Logged out successfully");
}