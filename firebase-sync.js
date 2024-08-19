// Initialize Firebase (replace with your actual config)

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPA5tLm3H889inLZvh_uWAHOxGNhC0gLc",
  authDomain: "order-management-system-ea2d3.firebaseapp.com",
  databaseURL: "https://order-management-system-ea2d3-default-rtdb.firebaseio.com",
  projectId: "order-management-system-ea2d3",
  storageBucket: "order-management-system-ea2d3.appspot.com",
  messagingSenderId: "779242930925",
  appId: "1:779242930925:web:46d09278bedd87d6aac2e4",
  measurementId: "G-K0F1E6FY6C"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

// Function to save data to Firebase
function saveData(data) {
    database.ref('orders').set(data);
  }
  
  // Function to load data from Firebase
  function loadData(callback) {
    database.ref('orders').once('value').then((snapshot) => {
      callback(snapshot.val());
    });
  }
  
  // Listen for changes in real-time
  database.ref('orders').on('value', (snapshot) => {
    updateUI(snapshot.val());
  });
  
  // Function to update the UI with new data
  function updateUI(data) {
    if (!data) return;
  
    // Update pending orders
    const pendingOrdersSection = document.getElementById('pendingOrdersSection');
    pendingOrdersSection.innerHTML = '<h2>Pending Orders</h2>';
    for (const [orderId, order] of Object.entries(data.pendingOrders || {})) {
      const orderElement = document.createElement('div');
      orderElement.innerHTML = `
        <p>Party Name: ${order.partyName}</p>
        <p>Order Date: ${order.orderDate}</p>
        <p>Items: ${order.items.map(item => `${item.name} (${item.size}: ${item.quantity})`).join(', ')}</p>
        <button onclick="dispatchOrder('${orderId}')">Dispatch</button>
      `;
      pendingOrdersSection.appendChild(orderElement);
    }
  
    // Update sent orders
    const sentOrdersSection = document.getElementById('sentOrdersSection');
    sentOrdersSection.innerHTML = '<h2>Sent Orders</h2>';
    for (const [orderId, order] of Object.entries(data.sentOrders || {})) {
      const orderElement = document.createElement('div');
      orderElement.innerHTML = `
        <p>Party Name: ${order.partyName}</p>
        <p>Dispatch Date: ${order.dispatchDate}</p>
        <p>Items: ${order.items.map(item => `${item.name} (${item.size}: ${item.quantity})`).join(', ')}</p>
      `;
      sentOrdersSection.appendChild(orderElement);
    }
  }
  
  // Function to save a new order
  function saveOrder() {
    const order = {
      partyName: document.getElementById('partyName').value,
      orderDate: new Date().toISOString(),
      items: getOrderItems()
    };
  
    loadData((data) => {
      if (!data) data = {};
      if (!data.pendingOrders) data.pendingOrders = {};
      const orderId = Date.now().toString();
      data.pendingOrders[orderId] = order;
      saveData(data);
    });
  
    clearOrderForm();
  }
  
  // Function to get order items from the form
  function getOrderItems() {
    const items = [];
    const sizeInputs = document.querySelectorAll('.size-input .size-column');
    sizeInputs.forEach(sizeColumn => {
      const size = sizeColumn.querySelector('label').textContent.trim();
      const quantity = sizeColumn.querySelector('input[type="radio"]:checked')?.value;
      if (quantity) {
        items.push({ name: 'Item', size: size, quantity: parseInt(quantity) });
      }
    });
    return items;
  }
  
  // Function to clear the order form
  function clearOrderForm() {
    document.getElementById('partyName').value = '';
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      radio.checked = false;
    });
  }
  
  // Function to dispatch an order
  function dispatchOrder(orderId) {
    loadData((data) => {
      if (!data.sentOrders) data.sentOrders = {};
      const order = data.pendingOrders[orderId];
      order.dispatchDate = new Date().toISOString();
      data.sentOrders[orderId] = order;
      delete data.pendingOrders[orderId];
      saveData(data);
    });
  }
  
  // Function to export data to XLS
  function exportToXLS(sectionId) {
    // Implement XLS export functionality here
    console.log(`Exporting ${sectionId} to XLS`);
  }
  
  // Load initial data
  loadData((data) => {
    updateUI(data);
  });
  
  // Event listeners
  document.getElementById('addItemBtn').addEventListener('click', () => {
    // Implement add item functionality
    console.log('Add item clicked');
  });
  
  document.getElementById('saveOrderBtn').addEventListener('click', saveOrder);
  
  document.getElementById('exportPendingXLSBtn').addEventListener('click', () => exportToXLS('pendingOrders'));
  document.getElementById('exportSentXLSBtn').addEventListener('click', () => exportToXLS('sentOrders'));
  
  // You may