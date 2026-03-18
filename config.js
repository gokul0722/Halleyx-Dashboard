let grid = null;
let selectedWidget = null;

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

function initGrid() {
  const gridEl = document.querySelector(".grid-stack");
  if (!gridEl) return;

  grid = GridStack.init({
    column: 12,
    cellHeight: 90,
    margin: 10,
    float: true,
    handle: ".drag-handle",
    resizable: {
      handles: "all"
    }
  }, gridEl);
}

function createWidgetContent(type, title, bodyHtml) {
  const isChart = ["bar", "line", "pie", "area", "scatter"].includes(type);

  const chartCanvas = isChart
    ? `<div class="widget-chart-box"><canvas class="widget-chart" height="160"></canvas></div>`
    : "";

  return `
    <div class="config-widget" data-widget-type="${type}">
      <div class="config-widget-title">
        <div class="drag-handle">⋮⋮ Drag</div>

        <div class="config-widget-actions">
          <button class="icon-small-btn" onclick="openWidgetSettings(this)">Settings</button>
          <button class="icon-small-btn" onclick="deleteWidget(this)">Delete</button>
        </div>
      </div>

      <h4 class="widget-main-title">${title}</h4>

      <div class="widget-placeholder-text">
        ${bodyHtml}
      </div>

      ${chartCanvas}
    </div>
  `;
}

function renderWidgetChart(widgetElement) {
  if (!widgetElement) return;

  const canvas = widgetElement.querySelector(".widget-chart");
  if (!canvas) return;

  const widgetType = widgetElement.getAttribute("data-widget-type");

  let chartType = "line";
  if (widgetType === "bar") chartType = "bar";
  if (widgetType === "pie") chartType = "pie";
  if (widgetType === "scatter") chartType = "scatter";
  if (widgetType === "area") chartType = "line";
  if (widgetType === "line") chartType = "line";

  const config = {
    type: chartType,
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "Orders",
        data: [12, 19, 8, 15, 22],
        backgroundColor: [
          "rgba(59,130,246,0.30)",
          "rgba(99,102,241,0.30)",
          "rgba(236,72,153,0.30)",
          "rgba(20,184,166,0.30)",
          "rgba(245,158,11,0.30)"
        ],
        borderColor: "#3b82f6",
        borderWidth: 2,
        fill: widgetType === "area",
        tension: 0.4,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: widgetType === "pie"
        }
      },
      scales: widgetType === "pie"
        ? {}
        : {
            y: {
              beginAtZero: true
            }
          }
    }
  };

  if (widgetType === "scatter") {
    config.data = {
      datasets: [{
        label: "Orders",
        data: [
          { x: 1, y: 12 },
          { x: 2, y: 19 },
          { x: 3, y: 8 },
          { x: 4, y: 15 },
          { x: 5, y: 22 }
        ],
        backgroundColor: "rgba(59,130,246,0.7)"
      }]
    };
    config.options.scales = {
      x: { beginAtZero: true },
      y: { beginAtZero: true }
    };
  }

  new Chart(canvas, config);
}

function addGridWidget(type, title, bodyHtml, w = 4, h = 4) {
  if (!grid) {
    showToast("Grid not initialized", "error");
    return;
  }

  const widgetHtml = createWidgetContent(type, title, bodyHtml);

  const item = document.createElement("div");
  item.className = "grid-stack-item";
  item.innerHTML = `<div class="grid-stack-item-content">${widgetHtml}</div>`;

  grid.addWidget(item, { w, h });

  setTimeout(() => {
    const widget = item.querySelector(".config-widget");
    renderWidgetChart(widget);
  }, 100);

  showToast(`${title} added`, "success");
}

function addChartType(type) {
  const titleMap = {
    bar: "Bar Chart",
    line: "Line Chart",
    pie: "Pie Chart",
    area: "Area Chart",
    scatter: "Scatter Plot"
  };

  const title = titleMap[type] || "Chart";

  addGridWidget(
    type,
    title,
    `
      <p><strong>Type:</strong> ${title}</p>
      <p><strong>Chart Kind:</strong> ${type}</p>
      <p>This widget will visualize customer order data.</p>
    `,
    type === "pie" ? 4 : 5,
    4
  );
}

function addTableWidget() {
  addGridWidget(
    "table",
    "Table",
    `
      <p><strong>Type:</strong> Table</p>
      <p>This widget will show customer order table data.</p>
    `,
    6,
    4
  );
}

function addKPIWidget() {
  addGridWidget(
    "kpi",
    "KPI Value",
    `
      <p><strong>Type:</strong> KPI</p>
      <p>This widget will show key performance values.</p>
    `,
    4,
    3
  );
}

function openWidgetSettings(button) {
  const widget = button.closest(".config-widget");
  if (!widget) return;

  selectedWidget = widget;

  const panel = document.getElementById("settingsPanel");
  if (!panel) return;

  const titleEl = document.getElementById("widgetTitle");
  const widthEl = document.getElementById("widgetWidth");
  const heightEl = document.getElementById("widgetHeight");

  if (titleEl) {
    const titleNode = widget.querySelector(".widget-main-title");
    titleEl.value = titleNode ? titleNode.textContent.trim() : "";
  }

  const gridItem = widget.closest(".grid-stack-item");
  if (gridItem && grid && widthEl && heightEl) {
    const node = gridItem.gridstackNode;
    widthEl.value = node?.w || 4;
    heightEl.value = node?.h || 4;
  }

  panel.classList.remove("hidden");
  document.getElementById("mainContent")?.classList.add("with-settings");
}

function closeSettingsPanel() {
  const panel = document.getElementById("settingsPanel");
  if (panel) panel.classList.add("hidden");

  document.getElementById("mainContent")?.classList.remove("with-settings");
  selectedWidget = null;
}

function saveWidgetSettings() {
  if (!selectedWidget) {
    closeSettingsPanel();
    return;
  }

  const titleEl = document.getElementById("widgetTitle");
  const widthEl = document.getElementById("widgetWidth");
  const heightEl = document.getElementById("widgetHeight");

  const titleNode = selectedWidget.querySelector(".widget-main-title");
  if (titleNode && titleEl) {
    titleNode.textContent = titleEl.value || "Untitled";
  }

  const gridItem = selectedWidget.closest(".grid-stack-item");
  if (gridItem && grid && widthEl && heightEl) {
    const node = gridItem.gridstackNode;
    const width = Number(widthEl.value) || 4;
    const height = Number(heightEl.value) || 4;
    grid.update(gridItem, { w: width, h: height });
  }

  showToast("Widget settings saved", "success");
  closeSettingsPanel();
}

function deleteWidget(button) {
  const gridItem = button.closest(".grid-stack-item");
  if (!gridItem || !grid) return;

  if (confirm("Delete this widget?")) {
    grid.removeWidget(gridItem);
    showToast("Widget deleted", "info");
  }
}

function saveConfiguration() {
  if (!grid) return;

  const layout = [];
  document.querySelectorAll(".grid-stack-item").forEach((item) => {
    const widget = item.querySelector(".config-widget");
    if (!widget) return;

    const node = item.gridstackNode;
    const title = widget.querySelector(".widget-main-title")?.textContent || "Untitled";
    const type = widget.getAttribute("data-widget-type") || "widget";
    const body = widget.querySelector(".widget-placeholder-text")?.innerHTML || "";

    layout.push({
      x: node?.x || 0,
      y: node?.y || 0,
      w: node?.w || 4,
      h: node?.h || 4,
      type,
      title,
      body
    });
  });

  localStorage.setItem("dashboardLayout", JSON.stringify(layout));
  showToast("Configuration saved", "success");
}

function resetLayout() {
  if (!grid) return;

  if (confirm("Reset all widgets?")) {
    grid.removeAll();
    localStorage.removeItem("dashboardLayout");
    showToast("Layout reset", "info");
  }
}

function loadSavedLayout() {
  const raw = localStorage.getItem("dashboardLayout");
  if (!raw || !grid) return;

  try {
    const layout = JSON.parse(raw);
    layout.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "grid-stack-item";
      wrapper.innerHTML = `
        <div class="grid-stack-item-content">
          ${createWidgetContent(item.type, item.title, item.body)}
        </div>
      `;

      grid.addWidget(wrapper, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      });

      setTimeout(() => {
        const widget = wrapper.querySelector(".config-widget");
        renderWidgetChart(widget);
      }, 100);
    });
  } catch (error) {
    console.error("Failed to load layout:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initGrid();
  loadSavedLayout();
});