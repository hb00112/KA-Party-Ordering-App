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
    document.getElementById('firmName').textContent = username;
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
        const [unapprovedOrders, approvedOrders] = await Promise.all([
            fetchOrdersByType('unapprovedorders', username),
            fetchOrdersByType('orders', username)
        ]);

        const allOrders = [...unapprovedOrders, ...approvedOrders]
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

        if (allOrders.length === 0) {
            showState(STATES.EMPTY);
            return;
        }

        displayOrders(allOrders);
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

function createOrderCard(order, template) {
    const card = template.content.cloneNode(true);
    const orderCard = card.querySelector('.order-card');
    
    // Set basic order info
    orderCard.dataset.orderId = order.referenceNumber;
    orderCard.querySelector('.order-reference').textContent = `Order #${order.referenceNumber}`;
    orderCard.querySelector('.order-date').textContent = formatDateTime(order.dateTime);
    
    // Set status badge
    const statusBadge = orderCard.querySelector('.order-status-badge');
    statusBadge.textContent = getOrderStatus(order.status);
    statusBadge.className = `order-status-badge status-${order.status.toLowerCase().replace(' ', '-')}`;

    // Create timeline
    createTimeline(orderCard, order);

    // Create items list
    createItemsList(orderCard, order);

    // Add order note if exists
    if (order.orderNote) {
        const noteDiv = orderCard.querySelector('.order-note');
        noteDiv.textContent = `Note: ${order.orderNote}`;
        noteDiv.classList.remove('hidden');
    }

    // Add event listeners
    const toggleBtn = orderCard.querySelector('.toggle-btn');
    toggleBtn.addEventListener('click', () => toggleOrderDetails(order.referenceNumber));

    return card;
}

function createTimeline(orderCard, order) {
    const timelineItems = orderCard.querySelector('.timeline-items');
    const events = [
        { 
            label: 'Order Placed',
            date: order.dateTime,
            completed: true
        },
        { 
            label: 'Processing',
            date: order.dateTime,
            completed: order.status !== 'New'
        },
        { 
            label: 'Approved',
            date: order.approvalDateTime,
            completed: order.status === 'Approved'
        }
    ];

    timelineItems.innerHTML = '';
    
    events.forEach((event, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${event.completed ? 'completed' : ''}`;
        
        // Create connector line if not the last item
        const connector = index < events.length - 1 ? '<div class="timeline-connector"></div>' : '';
        
        item.innerHTML = `
            <div class="timeline-step">
                <div class="timeline-marker ${event.completed ? 'completed' : ''}"></div>
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
    const itemsQuantity = orderCard.querySelector('.items-quantity');
    
    itemsQuantity.textContent = `${order.totalQuantity} items`;

    order.items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        
        const colorSizes = Object.entries(item.colors).map(([color, sizes]) => {
           

                    const sizeBadges = Object.entries(sizes)
                .map(([size, quantity]) => `
                    <span class="size-badge">
                        ${size}: ${quantity}
                    </span>
                `).join('');
            
            return `
                <div class="color-group">
                    <div class="color-name">${color}</div>
                    <div class="color-sizes">
                        ${sizeBadges}
                    </div>
                </div>
            `;
        }).join('');

        itemCard.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-colors">
                ${colorSizes}
            </div>
        `;
        
        itemsList.appendChild(itemCard);
    });
}

function getOrderStatus(status) {
    switch (status) {
        case 'Approved':
            return 'Order Approved';
        case 'Approval Pending':
            return 'Awaiting Approval';
        default:
            return 'Order Placed';
    }
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