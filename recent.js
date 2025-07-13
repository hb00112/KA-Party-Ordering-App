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

function findOrderByReference(referenceNumber) {
    // Get current orders from the displayed container
    const userId = localStorage.getItem('userId');
    const username = validUsers[userId].username;
    
    return new Promise((resolve, reject) => {
        firebase.database().ref('unapprovedorders')
            .orderByChild('partyName')
            .equalTo(username)
            .once('value')
            .then(snapshot => {
                let foundOrder = null;
                snapshot.forEach(child => {
                    const order = child.val();
                    if (order.referenceNumber === referenceNumber) {
                        foundOrder = {
                            id: child.key,
                            ...order
                        };
                    }
                });
                resolve(foundOrder);
            })
            .catch(reject);
    });
}

// Main PDF download function
async function downloadOrderPDF(referenceNumber) {
    try {
        const order = await findOrderByReference(referenceNumber);
        if (!order) {
            alert('Order not found');
            return;
        }
        
        generatePDF(order);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Generate PDF using jsPDF
function generatePDF(order) {
    // Load jsPDF if not already loaded
    if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // Wait a moment for the script to fully initialize
            setTimeout(() => generatePDF(order), 100);
        };
        document.head.appendChild(script);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Colors
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const lightGray = [240, 240, 240];
    
    let yPosition = 20;
    
    // Company Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('KAMBESHWAR AGENCIES', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('MAPUSA, GOA', 105, 30, { align: 'center' });
    
    yPosition = 50;
    
    // Order Information Header
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS', 20, yPosition);
    
    yPosition += 15;
    
    // Order details in two columns
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Order Reference:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${order.referenceNumber}`, 65, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order Date:', 20, yPosition + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTime(order.dateTime), 65, yPosition + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Party Name:', 20, yPosition + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(order.partyName, 65, yPosition + 16);
    
    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 120, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(order.status, 155, yPosition);
    
    if (order.approvedby) {
        doc.setFont('helvetica', 'bold');
        doc.text('Action By:', 120, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(order.approvedby, 155, yPosition + 8);
    }
    
    const totalQuantity = order.items.reduce((total, item) => {
        const itemTotal = Object.values(item.colors).reduce((colorTotal, sizes) => {
            return colorTotal + Object.values(sizes).reduce((a, b) => a + b, 0);
        }, 0);
        return total + itemTotal;
    }, 0);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Quantity:', 120, yPosition + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalQuantity} Pcs`, 155, yPosition + 16);
    
    yPosition += 35;
    
    // Items Section
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDERED ITEMS', 20, yPosition);
    
    yPosition += 10;
    
    // Items table
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    
    // Process items for the table
    order.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Item header
        doc.setFillColor(...lightGray);
        doc.rect(20, yPosition, 170, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.name}`, 22, yPosition + 6);
        
        yPosition += 15;
        
        // Color and size details
        doc.setFont('helvetica', 'normal');
        
        Object.entries(item.colors).forEach(([color, sizes]) => {
            // Check if we need a new page
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Color: ${color}`, 25, yPosition);
            yPosition += 6;
            
            doc.setFont('helvetica', 'normal');
            let sizeText = '';
            Object.entries(sizes).forEach(([size, quantity]) => {
                if (quantity > 0) {
                    sizeText += `${size}: ${quantity} pcs, `;
                }
            });
            
            // Remove trailing comma and space
            sizeText = sizeText.slice(0, -2);
            
            // Split long text into multiple lines
            const maxWidth = 160;
            const lines = doc.splitTextToSize(sizeText, maxWidth);
            
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 30, yPosition);
                yPosition += 5;
            });
            
            yPosition += 3;
        });
        
        yPosition += 5;
    });
    
    // Order note if exists
    if (order.orderNote) {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDER NOTE:', 20, yPosition);
        
        yPosition += 10;
        
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const noteLines = doc.splitTextToSize(order.orderNote, 170);
        noteLines.forEach(line => {
            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 5;
        });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`Order_${order.referenceNumber}.pdf`);
}

// Add CSS styles for the PDF button
const pdfButtonStyles = `
    .order-header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    
    .order-header-left {
        flex: 1;
    }
    
    .order-header-right {
        margin-left: 1rem;
    }
    
    .download-pdf-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .download-pdf-btn:hover {
        background: #2563eb;
    }
    
    .download-pdf-btn svg {
        width: 16px;
        height: 16px;
    }
    
    @media (max-width: 768px) {
        .order-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }
        
        .order-header-right {
            margin-left: 0;
            width: 100%;
        }
        
        .download-pdf-btn {
            width: 100%;
            justify-content: center;
        }
    }
`;

// Add the PDF button styles to the document
const pdfStyleSheet = document.createElement('style');
pdfStyleSheet.textContent = pdfButtonStyles;
document.head.appendChild(pdfStyleSheet);

// Initialize PDF library when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializePDFLibrary();
});


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

function initializePDFLibrary() {
    if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        document.head.appendChild(script);
    }
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
        <div class="order-header-left">
            <h3 class="order-reference">Order #${order.referenceNumber}</h3>
            <span class="total-quantity">Total Quantity: ${totalQuantity} Pcs</span>
        </div>
        <div class="order-header-right">
            <button class="download-pdf-btn" onclick="downloadOrderPDF('${order.referenceNumber}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
            </button>
        </div>
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
