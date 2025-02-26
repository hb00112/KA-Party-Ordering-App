// stock.js - Handles stock display functionality

let stockIndexedDB;
const STOCK_DB_NAME = 'StockIndexedDB';
const STOCK_STORE_NAME = 'stockItems';
const LAST_UPDATE_KEY = 'lastUpdate';

document.addEventListener('DOMContentLoaded', function() {
    initStockIndexedDB().then(() => {
        console.log("StockIndexedDB initialized");
        loadStockItems();
        setupFirebaseListener();
    }).catch(error => {
        console.error("Failed to initialize StockIndexedDB:", error);
        // Fallback to Firebase if IndexedDB fails
        loadStockItemsFromFirebase();
    });

    // Add back navigation from stock screen
    const backButton = document.querySelector('.stock-footer-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            playHapticFeedbackAndSound('medium');
        });
    }
});

function initStockIndexedDB() {
    return new Promise((resolve, reject) => {
        let request;
        try {
            request = window.indexedDB.open(STOCK_DB_NAME, 4);
        } catch (error) {
            console.error("Failed to open IndexedDB:", error);
            return reject(error);
        }
        
        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject("Failed to open IndexedDB");
        };
        
        request.onsuccess = (event) => {
            stockIndexedDB = event.target.result;
            
            // Add error handler for database
            stockIndexedDB.onerror = (event) => {
                console.error("Database error:", event.target.error);
            };
            
            resolve(stockIndexedDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Delete old object stores if they exist
            if (db.objectStoreNames.contains(STOCK_STORE_NAME)) {
                db.deleteObjectStore(STOCK_STORE_NAME);
            }
            if (db.objectStoreNames.contains('metadata')) {
                db.deleteObjectStore('metadata');
            }
            
            // Create new object stores
            db.createObjectStore(STOCK_STORE_NAME, { keyPath: "id", autoIncrement: false });
            db.createObjectStore('metadata', { keyPath: 'key' });
        };
    });
}

function saveLastUpdateTime(lastUpdate) {
    const transaction = stockIndexedDB.transaction(['metadata'], "readwrite");
    const store = transaction.objectStore('metadata');
    store.put({ key: LAST_UPDATE_KEY, value: lastUpdate });
    displayLastUpdateTime(lastUpdate);
}

function displayLastUpdateTime(lastUpdate) {
    if (lastUpdate) {
        const formattedDate = formatDate(lastUpdate);
        
        // Remove any existing marquee
        const existingMarquee = document.querySelector('#stockCheckScreen marquee');
        if (existingMarquee) {
            existingMarquee.remove();
        }
        
        const marquee = document.createElement('marquee');
        marquee.textContent = `Last stock update: ${formattedDate}`;
        marquee.style.backgroundColor = '#87044c';
        marquee.style.color = 'white';
        marquee.style.padding = '5px';
        marquee.style.marginBottom = '10px';
        
        const stockSection = document.getElementById('stockCheckScreen');
        if (stockSection) {
            stockSection.insertBefore(marquee, stockSection.firstChild.nextSibling);
        } else {
            console.error("Stock section not found");
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }
    
    return `${day}${suffix(day)} ${month} ${year} at ${hours}:${minutes}`;
}

function loadStockItems() {
    try {
        if (!stockIndexedDB) {
            throw new Error("IndexedDB not initialized");
        }

        const transaction = stockIndexedDB.transaction([STOCK_STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(STOCK_STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const stockData = event.target.result;
            if (stockData && stockData.length > 0) {
                displayStockItems(stockData);
                fetchLastUpdateTimeFromFirebase();
            } else {
                loadStockItemsFromFirebase();
            }
        };

        request.onerror = (error) => {
            console.error("Error loading stock from IndexedDB:", error);
            loadStockItemsFromFirebase();
        };

    } catch (error) {
        console.error("Error in loadStockItems:", error);
        loadStockItemsFromFirebase();
    }
}

function displayStockItems(stockData) {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = ''; // Clear existing items

    // Group items by name
    const groupedItems = stockData.reduce((acc, item) => {
        if (!acc[item['item name']]) {
            acc[item['item name']] = [];
        }
        acc[item['item name']].push(item);
        return acc;
    }, {});

    // Create a container div with flex layout
    stockList.classList.add('stock-list-container');

    Object.keys(groupedItems).forEach(itemName => {
        const itemButton = document.createElement('button');
        itemButton.classList.add('stock-item-btn');
        itemButton.textContent = itemName;
        
        itemButton.addEventListener('click', () => openItemStockModal(itemName, groupedItems[itemName]));
        stockList.appendChild(itemButton);
    });
}
function openItemStockModal(itemName, itemData) {
    const modal = document.getElementById('itemStockModal');
    const modalItemName = document.getElementById('modalItemName');
    const modalStockTable = document.getElementById('modalStockTable').getElementsByTagName('tbody')[0];
    const modalContent = document.querySelector('.stock-modal-content');

    modalItemName.textContent = itemName;
    modalStockTable.innerHTML = '';

    // Group by color
    const groupedByColor = itemData.reduce((acc, item) => {
        if (!acc[item.color]) {
            acc[item.color] = [];
        }
        acc[item.color].push(item);
        return acc;
    }, {});

    Object.entries(groupedByColor).forEach(([color, items]) => {
        const row = modalStockTable.insertRow();
        const cellColor = row.insertCell(0);
        const cellSizeQty = row.insertCell(1);

        cellColor.textContent = color;
        
        // Format size/quantity with integers only
        cellSizeQty.textContent = items.map(item => {
            // Remove decimal points from quantity
            const quantity = parseInt(item.quantity);
            return `${item.size}/${quantity}`;
        }).join(', ');
    });

    // Remove any existing stock note to prevent duplicates
    const existingNote = modal.querySelector('.stock-note');
    if (existingNote) {
        existingNote.remove();
    }

    // Add the stock note within the modal container
    const stockNote = document.createElement('p');
    stockNote.className = 'stock-note';
    stockNote.textContent = 'Note: Stock levels shown are updated weekly and may not reflect real-time availability';
    modalContent.appendChild(stockNote);

    // Ensure the modal content is scrollable if it exceeds the view height
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';

    modal.style.display = 'block';

    // Close modal when clicking on <span> (x)
    modal.querySelector('.close').onclick = function() {
        modal.style.display = 'none';
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function loadStockItemsFromFirebase() {
    const db = firebase.database();
    const stockRef = db.ref('stock');

    stockRef.once('value').then((snapshot) => {
        const stockData = snapshot.val();
        if (stockData) {
            displayStockItems(stockData);
            fetchLastUpdateTimeFromFirebase();
        } else {
            document.getElementById('stockList').innerHTML = '<p>No stock items available.</p>';
        }
    }).catch((error) => {
        console.error('Error loading stock data from Firebase:', error);
        document.getElementById('stockList').innerHTML = '<p>Error loading stock items. Please try again later.</p>';
    });
}

function fetchLastUpdateTimeFromFirebase() {
    const db = firebase.database();
    const lastUpdateRef = db.ref('lastUpdate');

    lastUpdateRef.once('value').then((snapshot) => {
        const lastUpdate = snapshot.val();
        if (lastUpdate) {
            saveLastUpdateTime(lastUpdate);
        } else {
            console.log("No last update time found in Firebase");
        }
    }).catch((error) => {
        console.error('Error fetching last update time from Firebase:', error);
    });
}

function setupFirebaseListener() {
    const db = firebase.database();
    const stockRef = db.ref('stock');
    const lastUpdateRef = db.ref('lastUpdate');

    stockRef.on('value', (snapshot) => {
        const stockData = snapshot.val();
        if (stockData) {
            displayStockItems(stockData);
        }
    }, (error) => {
        console.error("Firebase listener error:", error);
    });

    lastUpdateRef.on('value', (snapshot) => {
        const lastUpdate = snapshot.val();
        if (lastUpdate) {
            saveLastUpdateTime(lastUpdate);
        }
    });
}

// Function for haptic feedback
function playHapticFeedbackAndSound(intensity) {
    // This is a placeholder for haptic feedback functionality
    console.log(`Playing ${intensity} haptic feedback`);
    
    // Add actual haptic feedback implementation here if available
    if (navigator.vibrate && typeof navigator.vibrate === 'function') {
        switch(intensity) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'double':
                navigator.vibrate([15, 30, 15]);
                break;
            default:
                navigator.vibrate(10);
        }
    }
}