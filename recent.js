// Constants
const STATES = {
    LOADING: 'loadingState',
    ERROR: 'errorState',
    EMPTY: 'emptyState',
    CONTENT: 'ordersContainer'
};

// Initialize recent orders
function initializeRecentOrders() {
    const userId = localStorage.getItem('userId');
    if (!userId || !validUsers[userId]) {
        showError('User session not found. Please login again.');
        return;
    }
    
    const username = validUsers[userId].username;
    
    // Set the firm name in the subheader
    const headerFirmName = document.getElementById('headerFirmName');
    if (headerFirmName) {
        headerFirmName.textContent = `Firm: ${username}`;
    }
    
    // Fetch and display orders
    fetchAndDisplayOrders(username);
}
// State management
function showState(stateName) {
    Object.values(STATES).forEach(state => {
        document.getElementById(state).classList.add('hidden');
    });
    document.getElementById(stateName).classList.remove('hidden');
}

function showError(message) {
    const errorState = document.getElementById(STATES.ERROR);
    errorState.querySelector('.error-message').textContent = message;
    showState(STATES.ERROR);
}

// Fetch orders from Firebase
async function fetchAndDisplayOrders(username) {
    showState(STATES.LOADING);
    
    try {
        // Only fetch unapproved orders
        const unapprovedOrders = await fetchOrdersByType('unapprovedorders', username);
        
        // Sort by date
        const sortedOrders = unapprovedOrders
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

        if (sortedOrders.length === 0) {
            showState(STATES.EMPTY);
            return;
        }

        displayOrders(sortedOrders);
        showState(STATES.CONTENT);
    } catch (error) {
        console.error('Error fetching orders:', error);
        showError('Error loading orders. Please try again later.');
    }
}

function fetchOrdersByType(path, username) {
    return new Promise((resolve, reject) => {
        firebase.database().ref(path)
            .orderByChild('partyName')
            .equalTo(username)
            .once('value')
            .then(snapshot => {
                const orders = [];
                snapshot.forEach(child => {
                    orders.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                resolve(orders);
            })
            .catch(reject);
    });
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    const template = document.getElementById('orderCardTemplate');
    
    container.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order, template);
        container.appendChild(orderCard);
    });
}

function getOrderStatus(status, approvedBy = '', ardate = '') {
    let statusText = '';
    switch (status) {
        case 'Approved':
            statusText = `Current Status: Order has been approved by ${approvedBy}`;
            break;
        case 'Rejected':
            statusText = `Current Status: Order rejected by ${approvedBy}`;
            break;
        case 'Approval Pending':
            statusText = 'Current Status: Order sent to KA, Awaiting Approval';
            break;
        default:
            statusText = 'Current Status: Order Placed Successfully';
    }
    return statusText;
}

function createOrderCard(order, template) {
    const card = template.content.cloneNode(true);
    const orderCard = card.querySelector('.order-card');
    
    orderCard.dataset.orderId = order.referenceNumber;
    
    const totalQuantity = order.items.reduce((total, item) => {
        const itemTotal = Object.values(item.colors).reduce((colorTotal, sizes) => {
            return colorTotal + Object.values(sizes).reduce((a, b) => a + b, 0);
        }, 0);
        return total + itemTotal;
    }, 0);
    
    const headerContent = orderCard.querySelector('.order-header-content');
    headerContent.innerHTML = `
        <h3 class="order-reference">Order #${order.referenceNumber}</h3>
        <span class="total-quantity">Total Quantity: ${totalQuantity} Pcs</span>
    `;
    
    const statusBadge = orderCard.querySelector('.order-status-badge');
    statusBadge.innerHTML = getOrderStatus(order.status, order.approvedby, order.ardate);
    statusBadge.className = `order-status-badge status-${order.status.toLowerCase().replace(' ', '-')}`;

    createTimeline(orderCard, order);

    const itemsSection = orderCard.querySelector('.order-items');
    const itemCount = order.items.length;
    
    itemsSection.innerHTML = `
        <div class="order-items-header">
            <div class="items-header-content">
                <span class="items-title">Ordered Items (${itemCount})</span>
                <span class="toggle-icon">▼</span>
            </div>
        </div>
        <div class="order-items-content hidden">
            <div class="items-list"></div>
            <div class="order-note ${order.orderNote ? '' : 'hidden'}">${order.orderNote ? 'Note: ' + order.orderNote : ''}</div>
        </div>
    `;

    const headerElement = itemsSection.querySelector('.order-items-header');
    headerElement.style.cursor = 'pointer';
    headerElement.addEventListener('click', () => {
        const content = itemsSection.querySelector('.order-items-content');
        const toggleIcon = itemsSection.querySelector('.toggle-icon');
        
        content.classList.toggle('hidden');
        toggleIcon.textContent = content.classList.contains('hidden') ? '▼' : '▲';
    });

    createItemsList(orderCard, order);
    return card;
}
function createTimeline(orderCard, order) {
    const timelineItems = orderCard.querySelector('.timeline-items');
    const events = [
        { 
            label: 'Order Placed Successfully',
            date: order.dateTime,
            completed: true
        },
        { 
            label: 'Order sent to KA ',
            date: order.dateTime,
            completed: order.status !== 'New'
        },
        { 
            label: order.status === 'Rejected' ? 'Rejected' : 'Approved',
            date: order.ardate,
            completed: order.status === 'Approved' || order.status === 'Rejected'
        }
    ];

    timelineItems.innerHTML = '';
    
    events.forEach((event, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${event.completed ? 'completed' : ''}`;
        
        // Add rejected class if the status is rejected
        if (order.status === 'Rejected' && event.label === 'Rejected') {
            item.classList.add('rejected');
        }
        
        // Create connector line if not the last item
        const connector = index < events.length - 1 ? '<div class="timeline-connector"></div>' : '';
        
        item.innerHTML = `
            <div class="timeline-step">
                <div class="timeline-marker ${event.completed ? 'completed' : ''} ${order.status === 'Rejected' && event.label === 'Rejected' ? 'rejected' : ''}"></div>
                <div class="timeline-content">
                    <h4>${event.label}</h4>
                    <p>${event.completed ? formatDateTime(event.date) : 'Pending'}</p>
                </div>
            </div>
            ${connector}
        `;
        
        timelineItems.appendChild(item);
    });
}


function createItemsList(orderCard, order) {
    const itemsList = orderCard.querySelector('.items-list');
    
    const table = document.createElement('table');
    table.className = 'oa-items-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Colors and Sizes</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
                <tr>
                    <td class="oa-item-name">${item.name}</td>
                    <td>${createColorSizeHTML(item.colors)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    itemsList.appendChild(table);
}
function toggleOrderDetails(orderId) {
    const orderCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
    const content = orderCard.querySelector('.order-items-content');
    const toggleIcon = orderCard.querySelector('.toggle-icon');
    const isExpanded = !content.classList.contains('hidden');
    
    content.classList.toggle('hidden');
    toggleIcon.textContent = isExpanded ? '▼' : '▲';
    
    // Update header clickability
    orderCard.querySelector('.order-items-header').style.cursor = 'pointer';
}

function createColorSizeHTML(colors) {
    let html = '<div class="oa-color-size-grid">';
    for (const [color, sizes] of Object.entries(colors)) {
        for (const [size, quantity] of Object.entries(sizes)) {
            html += `
                <div class="oa-color-size-item">
                    ${color} - ${size}: ${quantity}
                </div>
            `;
        }
    }
    html += '</div>';
    return html;
}



function formatDateTime(dateTime) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTime).toLocaleString('en-US', options);
}

function toggleOrderDetails(orderId) {
    const orderCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
    const content = orderCard.querySelector('.order-items-content');
    const toggleBtn = orderCard.querySelector('.toggle-btn');
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    
    content.classList.toggle('hidden');
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
}

// Additional CSS styles for the color groups and sizes
const additionalStyles = `
    .color-group {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 0.375rem;
    }

    .color-name {
        font-weight: 500;
        color: #334155;
        margin-bottom: 0.5rem;
    }

    .color-sizes {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .size-badge {
        background: white;
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        color: #475569;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
`;

// Add the additional styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeRecentOrders);

// Event listener for order placement
document.addEventListener('orderPlaced', () => {
    const userId = localStorage.getItem('userId');
    if (userId && validUsers[userId]) {
        fetchAndDisplayOrders(validUsers[userId].username);
    }
});

//PTOB
const problemData = {
    "Order Status Issues": [
        "Status stuck in pending",
        "Approval information missing",
        "Timeline not updating",
        "Status not reflecting actions",
        "Incorrect order progression",
        "Other order status issue"
    ],
    "Item Details Problems": [
        "Wrong quantity calculation",
        "Size/color combination errors",
        "Duplicate items",
        "Missing color options",
        "Category mismatches",
        "Other item details issue"
    ],
    "Data Loading Issues": [
        "Infinite loading",
        "Partial data loading",
        "Data corruption",
        "Sync failures",
        "Incomplete history",
        "Other loading issue"
    ],
    "Display Issues": [
        "Broken layout",
        "Missing elements",
        "Unresponsive buttons",
        "Text overflow",
        "Mobile display",
        "Other display issue"
    ],
    "Reference Issues": [
        "Missing numbers",
        "Duplicate references",
        "Lookup failures",
        "Cross-reference errors",
        "Expired references",
        "Other reference issue"
    ],
    "Other": [
        "Custom issue"
    ]
};

const descriptions = {
    "Status stuck in pending": "Please provide the order number and duration it's been stuck in pending state",
    "Approval information missing": "Specify order number where approval details are not visible",
    "Timeline not updating": "Share order number and which timeline event isn't updating",
    "Status not reflecting actions": "Provide order number and what actions were taken but not shown",
    "Incorrect order progression": "List order number and explain what's wrong in the status sequence",
    "Wrong quantity calculation": "Share order number and explain the quantity discrepancy",
    "Size/color combination errors": "List order number and which size/color combinations are wrong",
    "Duplicate items": "Specify order number and which items are showing multiple times",
    "Missing color options": "Provide order number and which color options are not visible",
    "Category mismatches": "Share order number and explain the category error",
    "Infinite loading": "Specify which section is stuck loading and for how long",
    "Partial data loading": "Describe which parts of the order are not loading completely",
    "Data corruption": "Share order number and what data appears corrupted",
    "Sync failures": "Explain when the sync error occurs and what happens",
    "Incomplete history": "Describe what part of order history is missing",
    "Broken layout": "Specify which section has layout problems and how it appears",
    "Missing elements": "List which elements are not showing up and where",
    "Unresponsive buttons": "Mention which buttons aren't working and what happens when clicked",
    "Text overflow": "Share where text is not displaying properly",
    "Mobile display": "Describe what looks wrong on mobile view",
    "Missing numbers": "Provide which order reference numbers are missing",
    "Duplicate references": "List the duplicate reference numbers you've found",
    "Lookup failures": "Explain what happens when searching for specific references",
    "Cross-reference errors": "Share which references are showing wrong information",
    "Expired references": "Mention which references are showing as expired incorrectly",
    "Other order status issue": "Please describe your order status issue in detail",
    "Other item details issue": "Please describe your item details issue in detail",
    "Other loading issue": "Please describe your loading issue in detail",
    "Other display issue": "Please describe your display issue in detail",
    "Other reference issue": "Please describe your reference issue in detail",
    "Custom issue": "Please describe your issue in detail"
};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('problemModal');
    const btn = document.getElementById('reportProblemBtn');
    const closeBtn = document.querySelector('.close-btn');
    const problemSelect = document.getElementById('problemSelect');
    const subProblemSelect = document.getElementById('subProblemSelect');
    const descriptionField = document.getElementById('problemDescription');
    const submitBtn = document.getElementById('submitProblem');

    // Initialize the problem categories
    problemSelect.innerHTML = '<option value="">Select Problem Category</option>';
    Object.keys(problemData).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        problemSelect.appendChild(option);
    });

    btn.onclick = () => modal.style.display = "block";
    closeBtn.onclick = () => modal.style.display = "none";
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    problemSelect.addEventListener('change', (e) => {
        const category = e.target.value;
        subProblemSelect.innerHTML = '<option value="">Select Specific Issue</option>';
        
        if (category && problemData[category]) {
            problemData[category].forEach(subProblem => {
                const option = document.createElement('option');
                option.value = subProblem;
                option.textContent = subProblem;
                subProblemSelect.appendChild(option);
            });
            subProblemSelect.disabled = false;
        } else {
            subProblemSelect.disabled = true;
        }
        
        descriptionField.value = '';
        descriptionField.placeholder = 'Please describe your issue';
    });

    subProblemSelect.addEventListener('change', (e) => {
        const selectedSubProblem = e.target.value;
        if (descriptions[selectedSubProblem]) {
            descriptionField.placeholder = descriptions[selectedSubProblem];
            descriptionField.value = '';
        }
    });

    submitBtn.addEventListener('click', async () => {
        try {
            const userId = localStorage.getItem('userId');
            const userSnapshot = await database.ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val() || {};
            
            const problem = problemSelect.value;
            const subProblem = subProblemSelect.value;
            const description = descriptionField.value;
    
            const message = `Problem Report ❗
    ------------------
    User Details 👤
    Name: ${userData.name || 'N/A'}
    Designation: ${userData.designation || 'N/A'}
    Mobile: ${userData.mobile || 'N/A'}
    Email: ${userData.email || 'N/A'}
    ------------------
    Category 📝: ${problem}
    Issue ⚠️: ${subProblem}
    Description 📋:
    ${description}`;
    
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/919284494154?text=${encodedMessage}`, '_blank');
            modal.style.display = "none";
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('Error sending report. Please try again.');
        }
    });
});
