let editIndex = -1;

function generateCustomerId() {
  return "CUST-" + Date.now();
}

function generateOrderId() {
  return "ORD-" + Math.floor(Math.random() * 1000000);
}

function openOrderModal() {
  document.getElementById("orderModal").style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
  document.querySelector(".modal-header h3").innerText = "Create Order";
}

function goDashboard() {
  window.location.href = "dashboard.html";
}

function calculateTotal() {
  const quantity = Math.max(1, Number(document.getElementById("quantity").value) || 1);
  document.getElementById("quantity").value = quantity;

  const unitPrice = Number(document.getElementById("unitPrice").value) || 0;
  document.getElementById("totalAmount").value = "$" + (quantity * unitPrice).toFixed(2);
}

function saveOrder() {
  const fields = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    street: document.getElementById("street").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value.trim(),
    postal: document.getElementById("postal").value.trim(),
    country: document.getElementById("country").value,
    product: document.getElementById("product").value,
    quantity: document.getElementById("quantity").value,
    unitPrice: document.getElementById("unitPrice").value,
    totalAmount: document.getElementById("totalAmount").value,
    status: document.getElementById("status").value,
    createdBy: document.getElementById("createdBy").value
  };

  for (let key in fields) {
    if (!fields[key]) {
      showToast("Please fill the field", "error");
      return;
    }
  }

  const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];

  const order = {
    customerId: editIndex !== -1 && existingOrders[editIndex]?.customerId
      ? existingOrders[editIndex].customerId
      : generateCustomerId(),

    orderId: editIndex !== -1 && existingOrders[editIndex]?.orderId
      ? existingOrders[editIndex].orderId
      : generateOrderId(),

    customerName: fields.firstName + " " + fields.lastName,
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    phone: fields.phone,
    street: fields.street,
    city: fields.city,
    state: fields.state,
    postal: fields.postal,
    country: fields.country,
    address: `${fields.street}, ${fields.city}, ${fields.state}, ${fields.postal}, ${fields.country}`,
    product: fields.product,
    quantity: Number(fields.quantity),
    unitPrice: Number(fields.unitPrice),
    totalAmount: fields.totalAmount,
    status: fields.status,
    createdBy: fields.createdBy,
    orderDate: editIndex !== -1 && existingOrders[editIndex]?.orderDate
      ? existingOrders[editIndex].orderDate
      : new Date().toISOString()
  };

  const orders = existingOrders;
  const isEditMode = editIndex !== -1;

  if (editIndex === -1) {
    orders.push(order);
  } else {
    orders[editIndex] = order;
  }

  localStorage.setItem("orders", JSON.stringify(orders));

  closeOrderModal();
  clearForm();
  editIndex = -1;
  renderOrders();

  showToast(isEditMode ? "Order updated successfully!" : "Order created successfully!", "success");
}

function clearForm() {
  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("street").value = "";
  document.getElementById("city").value = "";
  document.getElementById("state").value = "";
  document.getElementById("postal").value = "";
  document.getElementById("country").value = "";
  document.getElementById("product").value = "";
  document.getElementById("quantity").value = 1;
  document.getElementById("unitPrice").value = "";
  document.getElementById("totalAmount").value = "";
  document.getElementById("status").value = "Pending";
  document.getElementById("createdBy").value = "";
}

function getStatusClass(status) {
  if (status === "Pending") return "pending";
  if (status === "In progress") return "progress";
  return "completed";
}

function renderOrders() {
  const tableBody = document.getElementById("ordersTableBody");
  if (!tableBody) return;

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align:center; color:#64748b;">No customer orders available yet.</td>
      </tr>
    `;
    return;
  }

  orders.forEach((order, index) => {
    tableBody.innerHTML += `
      <tr>
        <td>${order.customerId || "-"}</td>
        <td>${order.orderId || "-"}</td>
        <td>${order.customerName || "-"}</td>
        <td>${order.email || "-"}</td>
        <td>${order.product || "-"}</td>
        <td>${order.quantity || "-"}</td>
        <td>${order.totalAmount || "-"}</td>
        <td><span class="status ${getStatusClass(order.status)}">${order.status || "-"}</span></td>
        <td>${order.createdBy || "-"}</td>
        <td>${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editOrder(${index})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteOrder(${index})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editOrder(index) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders[index];
  if (!order) return;

  editIndex = index;

  document.getElementById("firstName").value = order.firstName || "";
  document.getElementById("lastName").value = order.lastName || "";
  document.getElementById("email").value = order.email || "";
  document.getElementById("phone").value = order.phone || "";
  document.getElementById("street").value = order.street || "";
  document.getElementById("city").value = order.city || "";
  document.getElementById("state").value = order.state || "";
  document.getElementById("postal").value = order.postal || "";
  document.getElementById("country").value = order.country || "";
  document.getElementById("product").value = order.product || "";
  document.getElementById("quantity").value = order.quantity || 1;
  document.getElementById("unitPrice").value = order.unitPrice || "";
  document.getElementById("totalAmount").value = order.totalAmount || "";
  document.getElementById("status").value = order.status || "Pending";
  document.getElementById("createdBy").value = order.createdBy || "";

  document.querySelector(".modal-header h3").innerText = "Edit Order";
  openOrderModal();
}

function deleteOrder(index) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  if (confirm("Are you sure you want to delete this order?")) {
    orders.splice(index, 1);
    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
    showToast("Order deleted successfully!", "success");
  }
}

function exportOrdersCSV() {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  if (!orders.length) {
    showToast("No orders available to export", "error");
    return;
  }

  const headers = [
    "Customer ID",
    "Order ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Product",
    "Quantity",
    "Unit Price",
    "Total Amount",
    "Status",
    "Created By",
    "Order Date"
  ];

  let csvContent = headers.join(",") + "\n";

  orders.forEach(order => {
    const row = [
      order.customerId || "",
      order.orderId || "",
      order.firstName || "",
      order.lastName || "",
      order.email || "",
      order.phone || "",
      order.product || "",
      order.quantity || "",
      order.unitPrice || "",
      order.totalAmount || "",
      order.status || "",
      order.createdBy || "",
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ""
    ];

    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.setAttribute("href", url);
  a.setAttribute("download", "customer_orders.csv");

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast("Orders exported successfully!", "info");
}

function importOrdersCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const text = e.target.result.trim();
    if (!text) {
      showToast("CSV file is empty", "error");
      return;
    }

    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      showToast("CSV file has no data rows", "error");
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim());

    const requiredHeaders = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Product",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Status",
      "Created By"
    ];

    const allHeadersPresent = requiredHeaders.every(h => headers.includes(h));
    if (!allHeadersPresent) {
      showToast("CSV headers are invalid", "error");
      return;
    }

    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length < headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      const order = {
        customerId: generateCustomerId(),
        orderId: generateOrderId(),
        customerName: `${row["First Name"]} ${row["Last Name"]}`.trim(),
        firstName: row["First Name"],
        lastName: row["Last Name"],
        email: row["Email"],
        phone: row["Phone"],
        street: "",
        city: "",
        state: "",
        postal: "",
        country: "",
        address: "",
        product: row["Product"],
        quantity: Number(row["Quantity"]) || 0,
        unitPrice: Number(String(row["Unit Price"]).replace("$", "")) || 0,
        totalAmount: row["Total Amount"],
        status: row["Status"],
        createdBy: row["Created By"],
        orderDate: new Date().toISOString()
      };

      orders.push(order);
    }

    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
    showToast("Orders imported successfully!", "success");

    event.target.value = "";
  };

  reader.readAsText(file);
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("dashboardTheme") || "light";
  const toggleBtn = document.getElementById("themeToggle");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (toggleBtn) toggleBtn.innerText = "☀️ Theme";
  } else {
    document.body.classList.remove("dark-mode");
    if (toggleBtn) toggleBtn.innerText = "🌙 Theme";
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("dashboardTheme", isDark ? "dark" : "light");
    toggleBtn.innerText = isDark ? "☀️ Theme" : "🌙 Theme";
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

document.addEventListener("DOMContentLoaded", function () {
  const quantity = document.getElementById("quantity");
  const unitPrice = document.getElementById("unitPrice");

  if (quantity && unitPrice) {
    quantity.addEventListener("input", calculateTotal);
    unitPrice.addEventListener("input", calculateTotal);
  }

  applySavedTheme();
  setupThemeToggle();
  renderOrders();
});