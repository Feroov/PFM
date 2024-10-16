document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        const loader = document.querySelector('.loader');
        const overlay = document.querySelector('.loader-overlay');
        const content = document.getElementById('content');

        loader.classList.add('hidden');
        overlay.classList.add('hidden');

        setTimeout(function () {
            loader.style.display = 'none';
            overlay.style.display = 'none';
            content.style.display = 'block';
        }, 1500);

    }, 2200);
});

const balanceEl = document.getElementById('balance');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const transactionListEl = document.getElementById('transaction-list');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const categoryFilterEl = document.getElementById('category-filter');
const transactionTypeEl = document.getElementById('transaction-type');
const recurringCheckbox = document.getElementById('recurring-checkbox');
const recurringIntervalEl = document.getElementById('recurring-interval');
const exportCsvBtn = document.getElementById('export-csv-btn');
const csvFileInput = document.getElementById('csv-file');
const importCsvBtn = document.getElementById('import-csv-btn');
const editModal = document.getElementById('editModal');
const editDescriptionEl = document.getElementById('edit-description');
const editAmountEl = document.getElementById('edit-amount');
const editTransactionTypeEl = document.getElementById('edit-transaction-type');
const editCategoryEl = document.getElementById('edit-category');
const deleteAllBtn = document.getElementById('delete-all-btn');

const darkModeToggle = document.getElementById('dark-mode-toggle');

const isDarkMode = localStorage.getItem('darkMode') === 'enabled';


let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let transactionChart;
let editIndex = null;
let expenseCategoryChart;

// Categories for income and expense
const incomeCategories = ['Salary', 'Bonus', 'Freelance', 'Other'];
const expenseCategories = ['Rent', 'Food', 'Utilities', 'Entertainment', 'Other'];

// Currency symbols
const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£'
};

// Get current currency from localStorage, default to USD
let currentCurrency = localStorage.getItem('currency') || 'usd';


// Function to animate the number change
function animateValue(element, start, end, duration) {
    const range = end - start;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(progress * range + start);
        element.textContent = formatAmount(value);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = formatAmount(end);  // Ensure final value is set
        }
    }

    requestAnimationFrame(step);
}


// Function to enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
}

// Function to disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
}

// Set the initial state based on localStorage
if (isDarkMode) {
    enableDarkMode();
    darkModeToggle.checked = true;
}

// Event listener for the dark mode toggle
darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    updateExpenseCategoryChart();
    updateIncomeExpenseTrendsChart();
});

// Add these elements to your HTML modal structure
const editRecurringCheckbox = document.getElementById('edit-recurring-checkbox');
const editRecurringIntervalEl = document.getElementById('edit-recurring-interval');

// Show the edit modal and populate with data
function openEditModal(index) {
    const transaction = transactions[index];

    if (!transaction) {
        console.error(`Transaction at index ${index} is null or undefined`);
        return;
    }

    // Populate modal fields with existing transaction data
    editDescriptionEl.value = transaction.description;
    editAmountEl.value = transaction.amount;
    editTransactionTypeEl.value = transaction.type;
    editIndex = index;

    // Update recurring options for both recurring and non-recurring transactions
    editRecurringCheckbox.checked = transaction.isRecurring || false;
    editRecurringIntervalEl.value = transaction.recurringInterval || 'monthly';
    editRecurringIntervalEl.disabled = !editRecurringCheckbox.checked;

    updateEditCategoryOptions();
    editCategoryEl.value = transaction.category;

    // Display modal with fade-in
    editModal.style.display = 'flex';
    editModal.classList.remove('fade-out');
    editModal.classList.add('fade-in');
}

function closeEditModal() {
    // Fade-out and hide the modal after the transition
    editModal.classList.remove('fade-in');
    editModal.classList.add('fade-out');
    setTimeout(() => {
        editModal.style.display = 'none';
    }, 300); // Match this with the CSS transition duration
}

// Close modal when clicking outside the modal content
editModal.addEventListener('click', function (event) {
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Event listener for recurring checkbox in edit modal
editRecurringCheckbox.addEventListener('change', function () {
    editRecurringIntervalEl.disabled = !this.checked;

    // If checked, ensure a default interval is selected
    if (this.checked && !editRecurringIntervalEl.value) {
        editRecurringIntervalEl.value = 'monthly';
    }
});


function saveEditedTransaction() {
    const updatedDescription = editDescriptionEl.value.trim();
    const updatedAmount = parseFloat(editAmountEl.value);
    const updatedType = editTransactionTypeEl.value;
    const updatedCategory = editCategoryEl.value;
    const updatedIsRecurring = editRecurringCheckbox.checked;
    const updatedRecurringInterval = updatedIsRecurring ? editRecurringIntervalEl.value : null;

    const updatedTransactionDate = document.getElementById('edit-transaction-date').value || transactions[editIndex].timestamp; // Keep existing date if not edited


    if (!updatedDescription || isNaN(updatedAmount)) {
        showNotification('Please enter valid description and amount', 'error');
        return;
    }
    const validDate = new Date(updatedTransactionDate);
    if (isNaN(validDate.getTime())) {
        console.error('Invalid date during transaction edit:', updatedTransactionDate);
        showNotification('Please provide a valid date', 'error');
        return;
    }
    // Update the existing transaction
    transactions[editIndex] = {
        ...transactions[editIndex],
        description: updatedDescription,
        amount: updatedAmount,
        type: updatedType,
        category: updatedCategory,
        isRecurring: updatedIsRecurring,
        recurringInterval: updatedRecurringInterval,
        timestamp: new Date(updatedTransactionDate).toISOString() // Update the date
    };

    // Save updated transactions to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update the UI and charts
    updateUI();
    closeEditModal();
    showNotification('Transaction updated successfully!', 'success');
}

function updateExpenseCategoryChart() {
    const chartCanvas = document.getElementById('expenseCategoryChart');
    const noDataMessage = document.getElementById('no-data-expenses-category');
    const ctx = chartCanvas.getContext('2d');

    const expenseTransactions = transactions.filter(transaction => transaction && transaction.type === 'expense');

    const expenseData = expenseCategories.map(category => {
        const total = expenseTransactions
            .filter(transaction => transaction.category === category)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        return total;
    });

    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
    }

    if (expenseData.every(amount => amount === 0)) {
        chartCanvas.style.display = 'none';
        noDataMessage.style.display = 'block';
        return;
    } else {
        chartCanvas.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    // Softer, less eye-straining colors
    const colors = [
        'rgba(144, 205, 244, 0.6)',  // Soft blue
        'rgba(229, 62, 62, 0.6)',    // Soft red
        'rgba(255, 206, 86, 0.6)',   // Yellow
        'rgba(75, 192, 192, 0.6)',   // Soft teal
        'rgba(153, 102, 255, 0.6)'   // Soft purple
    ];

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#000000';

    const symbol = currencySymbols[currentCurrency];

    expenseCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseCategories,
            datasets: [{
                label: `Amount (${symbol})`, // Update label with currency symbol
                data: expenseData,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.6', '1')), // Opaque border for all slices
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 15,
                        color: textColor
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: 4,
                    padding: {
                        top: 6,
                        right: 8,
                        bottom: 4,
                        left: 8
                    },
                    align: 'center',
                    anchor: 'center',
                    formatter: function (value) {
                        return value > 0 ? `${symbol}${value.toFixed(2)}` : '';  // Use dynamic currency symbol
                    },
                    display: function (context) {
                        return context.dataset.data[context.dataIndex] > 0; // Only display labels for values > 0
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        },
        plugins: [ChartDataLabels]
    });

}

// Open the modal when clicking "Edit"
function editTransaction(index) {
    const transaction = transactions[index];

    // Fill the form with transaction data
    descriptionEl.value = transaction.description;
    amountEl.value = transaction.amount;
    transactionTypeEl.value = transaction.type;
    updateCategoryOptions();
    categoryEl.value = transaction.category;

    if (transaction.isRecurring) {
        recurringCheckbox.checked = true;
        recurringIntervalEl.disabled = false;
        recurringIntervalEl.value = transaction.recurringInterval;
    }

    // Remove the old transaction
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();

    // Scroll to form and show hint
    scrollToAddTransaction();
    showNotification('Edit your transaction and click "Add Transaction" to save changes');
}

// Updated function for editing categories in the modal
function updateEditCategoryOptions() {
    const selectedType = editTransactionTypeEl.value;
    editCategoryEl.innerHTML = '';

    const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        editCategoryEl.appendChild(option);
    });
}

function updateChart() {
    const income = transactions
        .filter(transaction => transaction && transaction.type === 'income')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const expenses = transactions
        .filter(transaction => transaction && transaction.type === 'expense')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const chartCanvas = document.getElementById('transactionChart');
    const noDataMessage = document.getElementById('no-data-income-expenses');

    if (transactionChart) {
        transactionChart.destroy();
    }

    // If no income and expenses, hide chart and show "No data found"
    if (income === 0 && expenses === 0) {
        chartCanvas.style.display = 'none';
        noDataMessage.style.display = 'block';
        return;
    } else {
        chartCanvas.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    const ctx = chartCanvas.getContext('2d');
    const isDarkMode = document.body.classList.contains('dark-mode');

    // Set colors based on dark or light mode with opacity
    const backgroundColor = isDarkMode ? '#2d3748' : '#ffffff';
    const incomeBarColor = isDarkMode ? 'rgba(75, 192, 192, 0.6)' : 'rgba(75, 192, 192, 0.6)'; // Softer blue with opacity
    const expensesBarColor = isDarkMode ? 'rgba(229, 62, 62, 0.6)' : 'rgba(229, 62, 62, 0.6)'; // Softer red with opacity
    const borderColor = isDarkMode ? '#1a202c' : '#e2e8f0'; // Darker border for dark mode, lighter for light mode
    const textColor = isDarkMode ? '#ffffff' : '#2d3748'; // White for dark mode, black for light mode

    // Set the background of the canvas to the chosen background color
    chartCanvas.style.backgroundColor = backgroundColor;

    const symbol = currencySymbols[currentCurrency];

    transactionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: `Amount (${symbol})`, // Add the currency symbol to the label
                data: [income, expenses],
                backgroundColor: [incomeBarColor, expensesBarColor],
                borderColor: [borderColor, borderColor],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: borderColor,
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                    },
                    grid: {
                        color: borderColor,
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    formatter: function (value) {
                        return `${symbol}${value.toFixed(2)}`; // Use dynamic currency symbol
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: 4,
                    padding: {
                        top: 9,
                        right: 6,
                        bottom: 6,
                        left: 6
                    },
                    offset: 0
                }
            },
            responsive: true,
            maintainAspectRatio: false
        },
        plugins: [ChartDataLabels]
    });

}

function handleDarkModeToggle() {
    const darkModeIcon = document.getElementById('dark-mode-toggle');

    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        enableDarkMode();
    }

    // Update chart and icon when dark mode is toggled
    darkModeIcon.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            enableDarkMode();
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    updateChart();
    updateExpenseCategoryChart();
    updateIncomeExpenseTrendsChart();
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateChart();
    updateExpenseCategoryChart();
    updateIncomeExpenseTrendsChart();
}

handleDarkModeToggle();
updateChart();

// Function to dynamically update the categories based on transaction type
function updateCategoryOptions() {
    const selectedType = transactionTypeEl.value;

    // Clear existing categories
    categoryEl.innerHTML = '';

    // Get appropriate categories based on type
    const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

    // Add categories to the dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryEl.appendChild(option);
    });
}

// Call the function initially to populate the categories when the page loads
updateCategoryOptions();

function scrollToAddTransaction() {
    const addTransactionForm = document.querySelector('.transaction-form');
    addTransactionForm.scrollIntoView({ behavior: 'smooth' });
}

function showScrollHint() {
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 15l7-7 7 7"/>
        </svg>
        Click here to add a new transaction
    `;
    hint.addEventListener('click', () => {
        scrollToAddTransaction();
        hint.remove();
    });
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 5000);
}

// Call updateChart inside the updateUI function to refresh the chart when the UI updates
function updateUI() {
    let income = 0, expenses = 0;
    const transactionListEl = document.getElementById('transaction-list');
    const noTransactionsMessage = document.getElementById('no-transactions-message');
    transactionListEl.innerHTML = '';

    const filterCategory = categoryFilterEl.value;

    // Filter valid transactions
    const validTransactions = transactions.filter(transaction => transaction !== null && transaction !== undefined);

    if (validTransactions.length === 0) {
        noTransactionsMessage.style.display = 'block';
    } else {
        noTransactionsMessage.style.display = 'none';

        const sortedTransactions = [...validTransactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedTransactions.forEach((transaction) => {
            if (!transaction) return;

            if (filterCategory !== 'all' && transaction.category !== filterCategory) {
                return;
            }

            // Update totals
            if (transaction.type === 'income') {
                income += transaction.amount;
            } else {
                expenses += transaction.amount;
            }

            const transactionEl = document.createElement('div');
            const actualIndex = transactions.indexOf(transaction);
            transactionEl.setAttribute('data-transaction-index', actualIndex);

            transactionEl.className = `transaction-item ${transaction.isRecurring ? 'recurring' : ''}`;
            const formattedDate = new Date(transaction.timestamp).toLocaleDateString();

            const recurringText = transaction.isRecurring
                ? `<i class="fas fa-repeat recurring-icon"></i> <span class="recurring-text">Recurring (${transaction.recurringInterval})</span>`
                : '';

            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-type-icon ${transaction.type}">
                        ${transaction.type === 'income' ?
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' :
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
                }
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-description">${transaction.description}</span>
                        <span class="transaction-category">${transaction.category}</span>
                        ${transaction.isRecurring ? `<span class="recurring-info">${recurringText}</span>` : ''}
                        <span class="transaction-timestamp">${formattedDate}</span>
                    </div>
                </div>
                <div class="transaction-actions">
                    <span class="transaction-amount ${transaction.type}">
                        ${formatAmount(transaction.amount)}
                    </span>
                    <button class="action-button edit" onclick="editTransaction(${actualIndex})" aria-label="Edit transaction">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </button>
                    <button class="action-button delete" onclick="removeTransaction(${actualIndex})" aria-label="Delete transaction">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            transactionListEl.appendChild(transactionEl);
        });
    }

    // Update balance, income, and expenses with formatted amounts
    const balance = income - expenses;
    animateValue(balanceEl, parseFloat(balanceEl.textContent.replace(/[^\d.-]/g, '')), balance, 1500);
    animateValue(incomeTotalEl, parseFloat(incomeTotalEl.textContent.replace(/[^\d.-]/g, '')), income, 1500);
    animateValue(expenseTotalEl, parseFloat(expenseTotalEl.textContent.replace(/[^\d.-]/g, '')), expenses, 1500);

    // Update financial health percentage dynamically
    updateFinancialHealth(expenses, income);

    updateChart();
    updateExpenseCategoryChart();
    updateIncomeExpenseTrendsChart();
    updateHeartColor(expenses, income);
}

// Function to update financial health percentage
function updateFinancialHealth(expenses, income) {
    const healthPercentageEl = document.getElementById('health-percentage');
    const heartIcon = document.getElementById('financial-heart');

    // Calculate financial health percentage
    let financialHealth = ((income - expenses) / income) * 100;
    if (income === 0) financialHealth = 0; // Avoid division by zero

    financialHealth = Math.max(0, Math.min(100, financialHealth.toFixed(2))); // Ensure it's between 0 and 100

    if (healthPercentageEl) {
        healthPercentageEl.textContent = `${financialHealth}%`;
    }

    // Update tooltip
    heartIcon.addEventListener('mouseenter', () => {
        updateTooltip(financialHealth);
    });
}

// Function to update the tooltip content dynamically
function updateTooltip(health) {
    const tooltip = document.querySelector('.tooltip');
    tooltip.innerHTML = `Financial Health: ${health}%`;
}

// Function to update the heart icon color based on expense-to-income ratio
function updateHeartColor(expenses, income) {
    const heartIcon = document.getElementById('financial-heart');
    let ratio = expenses / income;

    // Prevent division by zero
    if (income === 0) ratio = 1;

    // Define a gradient with multiple color stops at different ratio intervals
    let gradient;

    if (ratio <= 0.1) {
        // Green
        gradient = `linear-gradient(135deg, #4caf50 0%, #4caf50 100%)`; // Solid green
    } else if (ratio <= 0.2) {
        // Green to lighter green
        gradient = `linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)`;
    } else if (ratio <= 0.3) {
        // Green to yellowish green
        gradient = `linear-gradient(135deg, #8bc34a 0%, #cddc39 100%)`;
    } else if (ratio <= 0.4) {
        // Yellowish green to yellow
        gradient = `linear-gradient(135deg, #cddc39 0%, #ffeb3b 100%)`;
    } else if (ratio <= 0.5) {
        // Yellow to light orange
        gradient = `linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)`;
    } else if (ratio <= 0.6) {
        // Light orange to orange
        gradient = `linear-gradient(135deg, #ffc107 0%, #ff9800 100%)`;
    } else if (ratio <= 0.7) {
        // Orange to darker orange
        gradient = `linear-gradient(135deg, #ff9800 0%, #ff5722 100%)`;
    } else if (ratio <= 0.8) {
        // Dark orange to reddish orange
        gradient = `linear-gradient(135deg, #ff5722 0%, #f44336 100%)`;
    } else if (ratio <= 0.9) {
        // Reddish orange to red
        gradient = `linear-gradient(135deg, #f44336 0%, #e91e63 100%)`;
    } else {
        // Solid red
        gradient = `linear-gradient(135deg, #e91e63 0%, #e91e63 100%)`; // Solid red
    }

    // Apply the gradient to the heart icon
    heartIcon.style.backgroundImage = gradient;
    heartIcon.style.backgroundClip = "text";
    heartIcon.style.color = "transparent";
    heartIcon.style.backgroundSize = '200% 200%'; // Larger area for a smooth transition
    heartIcon.style.backgroundPosition = 'center';
}




// Function to edit a transaction
function editTransaction(index) {
    openEditModal(index);
}

let isDescriptionErrorShown = false;  // Flag to track if the error is already shown

// Function to show the error notification only once
function showErrorNotificationOnce(message) {
    if (!isDescriptionErrorShown) {
        showNotification(message, 'error');
        isDescriptionErrorShown = true; // Set flag to true once error is shown
    }
}

// Prevent typing after reaching 60 characters and show error notification
descriptionEl.addEventListener('input', function () {
    if (this.value.length > 60) {
        this.value = this.value.substring(0, 60);  // Prevent more than 60 characters
        showErrorNotificationOnce('Description cannot exceed 60 characters'); // Show the error once
    } else if (isDescriptionErrorShown && this.value.length <= 60) {
        // If the error was shown and the description is valid again, reset the flag
        isDescriptionErrorShown = false;
    }
});

function addTransaction() {
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const type = transactionTypeEl.value;
    const category = categoryEl.value;
    const isRecurring = recurringCheckbox.checked;
    const recurringInterval = isRecurring ? recurringIntervalEl.value : null;

    const transactionDate = document.getElementById('transaction-date').value || new Date().toISOString().split('T')[0]; // Default to today's date if not selected

    // Check for character limit in the description
    if (description.length > 60) {
        showErrorNotificationOnce('Description cannot exceed 60 characters');
        return;
    }

    // Show modal if description or amount is invalid
    if (!description || isNaN(amount)) {
        showModal();
        return;
    }

    const transaction = {
        description,
        amount,
        initialAmount: amount,
        type,
        category,
        isRecurring,
        recurringInterval,
        timestamp: new Date(transactionDate).toISOString(),
        lastAddedDate: isRecurring ? new Date().toISOString() : null
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();

    // Clear form fields
    descriptionEl.value = '';
    amountEl.value = '';
    document.getElementById('transaction-date').value = ''; // Clear date input
    recurringCheckbox.checked = false;
    recurringIntervalEl.disabled = true;
    recurringIntervalEl.value = 'monthly';

    showNotification('Transaction added successfully!', 'success');
}

// Prevent typing after reaching 60 characters and show error notification
descriptionEl.addEventListener('input', function () {
    if (this.value.length > 60) {
        this.value = this.value.substring(0, 60);  // Prevent more than 60 characters
        showNotification('Description cannot exceed 60 characters', 'error');
    }
});



// Function to show the error modal
function showModal() {
    const modal = document.getElementById('errorModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Add fade-in animation class
    modal.classList.add('fade-in');

    // Automatically hide the modal after 2 seconds
    setTimeout(() => {
        modal.classList.remove('fade-in');
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
        }, 500);
    }, 3000);

    // Allow manual close with fade-out effect
    const closeModalBtn = document.getElementById('close-error-modal');
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('fade-in');
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
        }, 500);
    });
}

// Function to remove a transaction
function removeTransaction(index) {
    // Check if the index is valid
    if (index < 0 || index >= transactions.length) {
        console.error('Invalid transaction index:', index);
        showNotification('Error deleting transaction', 'error');
        return;
    }

    // Find the specific transaction element using a data attribute instead of index
    const transactionEl = document.querySelector(`[data-transaction-index="${index}"]`);

    if (transactionEl) {
        // Add the deletion animation class
        transactionEl.classList.add('deleting');

        // Wait for animation to complete before removing
        setTimeout(() => {
            // Remove the transaction from the array
            transactions.splice(index, 1);

            // Update localStorage
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Update the UI
            updateUI();

            showNotification('Transaction deleted successfully');
        }, 400); // Match this with your CSS animation duration
    } else {
        console.error('Transaction element not found');
        showNotification('Error deleting transaction', 'error');
    }
}

// Function to handle recurring transactions on a set interval
function processRecurringTransactions() {
    const currentDate = new Date();
    let transactionsUpdated = false;

    transactions = transactions.map(transaction => {
        if (!transaction || !transaction.isRecurring || !transaction.lastAddedDate) {
            return transaction;
        }

        const lastAddedDate = new Date(transaction.lastAddedDate);
        let timesToAdd = 0;

        // Calculate time difference in milliseconds
        const timeDifference = currentDate - lastAddedDate;

        // Check intervals and calculate how many times to add the amount
        switch (transaction.recurringInterval) {
            case 'daily':
                timesToAdd = Math.floor(timeDifference / (24 * 60 * 60 * 1000));
                break;
            case 'weekly':
                timesToAdd = Math.floor(timeDifference / (7 * 24 * 60 * 60 * 1000));
                break;
            case 'monthly':
                // Calculate months difference
                timesToAdd = (currentDate.getMonth() + 12 * currentDate.getFullYear()) -
                    (lastAddedDate.getMonth() + 12 * lastAddedDate.getFullYear());
                break;
        }

        if (timesToAdd > 0) {
            transactionsUpdated = true;

            // Update the amount of the existing transaction
            transaction.amount += transaction.amount * timesToAdd;

            // Update the lastAddedDate
            const newLastAddedDate = new Date(lastAddedDate);
            switch (transaction.recurringInterval) {
                case 'daily':
                    newLastAddedDate.setDate(newLastAddedDate.getDate() + timesToAdd);
                    break;
                case 'weekly':
                    newLastAddedDate.setDate(newLastAddedDate.getDate() + (timesToAdd * 7));
                    break;
                case 'monthly':
                    newLastAddedDate.setMonth(newLastAddedDate.getMonth() + timesToAdd);
                    break;
            }
            transaction.lastAddedDate = newLastAddedDate.toISOString();
        }

        return transaction;
    });

    // Only update localStorage and UI if changes were made
    if (transactionsUpdated) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        borderRadius: '0.5rem',
        backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function exportToCSV() {
    if (transactions.length === 0) {
        showNoExportModal('CSV');
        return;
    }

    const csvRows = [];
    const headers = ['Description', 'Amount', 'Type', 'Category', 'IsRecurring', 'RecurringInterval', 'Timestamp'];
    csvRows.push(headers.join(','));

    transactions.forEach(transaction => {
        const row = [
            `"${transaction.description}"`,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? 'Yes' : 'No',
            transaction.recurringInterval || '',
            transaction.timestamp || new Date().toISOString() // Add the timestamp or current date if missing
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transactions.csv');
    a.click();

    showNotification('CSV exported successfully!', 'success');
}


function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add your logo at the top of the page with adjusted width and height for proper aspect ratio
    const logo = new Image();
    logo.src = './assets/img/logo.png'; // Path to your logo
    doc.addImage(logo, 'PNG', 10, 10, 30, 30); // Adjust width and height for better aspect ratio

    // Set document title and metadata
    doc.setFontSize(20);
    doc.text("Transaction Report", 105, 25, null, null, "center");

    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 105, 33, null, null, "center");

    // Custom section (replaces address)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Financial Overview", 10, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Report: ${new Date().toLocaleDateString()}`, 10, 60);
    doc.text(`Number of Transactions: ${transactions.length}`, 10, 70);


    // Section Divider
    doc.setDrawColor(0, 0, 0);
    doc.line(10, 75, 200, 75);

    // Headers and transaction data
    const headers = [
        { header: 'Description', dataKey: 'description' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Type', dataKey: 'type' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Recurring', dataKey: 'isRecurring' },
        { header: 'Interval', dataKey: 'recurringInterval' }
    ];

    // Format the rows and replace 'eur' with the proper symbol dynamically
    const currencySymbol = currentCurrency === 'usd' ? '$' : currentCurrency === 'gbp' ? '£' : '€';

    const rows = transactions.map(transaction => ({
        description: transaction.description,
        amount: `${currencySymbol}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format amount with commas
        type: transaction.type,
        category: transaction.category,
        isRecurring: transaction.isRecurring ? 'Yes' : 'No',
        recurringInterval: transaction.recurringInterval || ''
    }));


    // Customized autoTable
    doc.autoTable({
        startY: 80, // Start after the logo and title
        head: [headers.map(col => col.header)], // Only take the header names
        body: rows.map(row => Object.values(row)), // Map row data into an array of values
        margin: { top: 10, left: 10, right: 10 },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
        },
        headStyles: {
            fillColor: [100, 149, 237], // Custom header background color
            textColor: [255, 255, 255], // White text color
            fontStyle: 'bold'
        },
        bodyStyles: {
            halign: 'left',
            textColor: [0, 0, 0],
        },
        didDrawPage: function (data) {
            doc.setFontSize(10);
        },
    });

    // Calculate the totals as numbers before formatting
    const totalIncomeValue = transactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpensesValue = transactions.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    // Calculate the balance before formatting
    const balanceValue = totalIncomeValue - totalExpensesValue;

    // Format the totals and balance for display with commas and decimals
    const totalIncome = totalIncomeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalExpenses = totalExpensesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const balance = balanceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 10, doc.autoTable.previous.finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Income: ${currencySymbol}${totalIncome}`, 10, doc.autoTable.previous.finalY + 20);
    doc.text(`Total Expenses: ${currencySymbol}${totalExpenses}`, 10, doc.autoTable.previous.finalY + 30);
    doc.text(`Current Balance: ${currencySymbol}${balance}`, 10, doc.autoTable.previous.finalY + 40);


    doc.save(`transactions_report_${currentDate}.pdf`);
}


// Helper function to wrap text to a max length
function wrapText(text, maxLength) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length < maxLength) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine.trim());

    return lines.join('\n');
}


// Helper function to wrap text
function wrapText(text, maxLength) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length < maxLength) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine.trim());

    return lines.join('\n');
}


function exportToExcel() {
    if (transactions.length === 0) {
        showNoExportModal('Excel');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws_data = [["Description", "Amount", "Type", "Category", "Recurring", "RecurringInterval", "Timestamp"]];

    transactions.forEach((transaction) => {
        ws_data.push([
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? "Yes" : "No",
            transaction.recurringInterval || '',
            new Date(transaction.timestamp).toISOString() // Ensure timestamp is properly formatted as ISO string
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    XLSX.writeFile(wb, "transactions.xlsx");
    showNotification('Excel exported successfully!', 'success');
}

function exportToJSON() {
    if (transactions.length === 0) {
        showNoExportModal('JSON');
        return;
    }

    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transactions.json');
    a.click();

    showNotification('JSON exported successfully!', 'success');
}

function tryParseDate(dateString) {
    const dateFormats = [
        'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY', 'DD-MM-YYYY'
    ];

    for (const format of dateFormats) {
        const parsedDate = moment(dateString, format, true);
        if (parsedDate.isValid()) {
            return new Date(parsedDate.toISOString());
        }
    }

    // Return `null` if no valid format is found
    return null;
}


// Function to import transactions from CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const csvText = e.target.result;
            const rows = csvText.split('\n').filter(row => row.trim());

            const newTransactions = rows.slice(1).map(row => {
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                let timestamp = columns[6] ? new Date(columns[6].trim()) : new Date(); // Replace empty or invalid with current date

                // Attempt to parse the date in different formats if invalid
                if (isNaN(timestamp.getTime())) {
                    timestamp = tryParseDate(columns[6].trim());
                }

                if (!timestamp || isNaN(timestamp.getTime())) {
                    console.error('Invalid timestamp in CSV row:', row);
                    return null; // Skip invalid rows
                }

                return {
                    description: columns[0].replace(/"/g, '').trim(),
                    amount: parseFloat(columns[1]),
                    type: columns[2].trim(),
                    category: columns[3].trim(),
                    isRecurring: columns[4].trim() === 'Yes',
                    recurringInterval: columns[5] ? columns[5].trim() : null,
                    timestamp: timestamp.toISOString()
                };
            }).filter(transaction => transaction !== null); // Filter out invalid transactions

            const validTransactions = newTransactions.filter(transaction =>
                transaction.description &&
                !isNaN(transaction.amount) &&
                ['income', 'expense'].includes(transaction.type)
            );

            if (validTransactions.length === 0) {
                throw new Error('No valid transactions found in the CSV file');
            }

            transactions.push(...validTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();

            showNotification('Successfully imported ' + validTransactions.length + ' transactions!');
            document.getElementById('csv-file').value = '';

        } catch (error) {
            console.error('Error importing CSV:', error);
            showNotification('Error importing CSV file. Please check the file format.', 'error');
        }
    };

    reader.onerror = function () {
        showNotification('Error reading the file. Please try again.', 'error');
    };

    reader.readAsText(file);
}


// Add event listener for PDF export button
document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

// Add event listener for Excel export button
document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet data to JSON
        const sheetData = XLSX.utils.sheet_to_json(worksheet);

        const newTransactions = sheetData.map(row => {
            let timestamp = new Date(row['Timestamp']); // Parse the timestamp as a date
            if (isNaN(timestamp.getTime())) {
                // Handle cases where the date is invalid
                timestamp = new Date(); // Use the current date if timestamp is invalid
            }
            return {
                description: row['Description'],
                amount: parseFloat(row['Amount']),
                type: row['Type'],
                category: row['Category'],
                isRecurring: row['Recurring'] === 'Yes',
                recurringInterval: row['RecurringInterval'] || null,
                timestamp: timestamp.toISOString() // Store the timestamp as an ISO string
            };
        });

        const validTransactions = newTransactions.filter(transaction =>
            transaction.description &&
            !isNaN(transaction.amount) &&
            ['income', 'expense'].includes(transaction.type)
        );

        if (validTransactions.length === 0) {
            throw new Error('No valid transactions found in the Excel file.');
        }

        transactions.push(...validTransactions);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();

        showNotification('Successfully imported ' + validTransactions.length + ' transactions from Excel!', 'success');
        document.getElementById('excel-file').value = '';
    };

    reader.onerror = function () {
        showNotification('Error reading the Excel file. Please try again.', 'error');
    };

    reader.readAsArrayBuffer(file);
}



// Add event listener for Excel import button
document.getElementById('import-excel-btn').addEventListener('click', () => {
    document.getElementById('excel-file').click();
});
document.getElementById('excel-file').addEventListener('change', importFromExcel);

// Function to import transactions from JSON
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonText = e.target.result;
            const importedTransactions = JSON.parse(jsonText);

            // Validate each transaction before adding it to the transactions array
            const validTransactions = importedTransactions.filter(transaction =>
                transaction &&
                typeof transaction.description === 'string' &&
                !isNaN(transaction.amount) &&
                ['income', 'expense'].includes(transaction.type) &&
                typeof transaction.category === 'string'
            );

            if (validTransactions.length === 0) {
                throw new Error('No valid transactions found in the JSON file.');
            }

            transactions.push(...validTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();

            showNotification(`Successfully imported ${validTransactions.length} transactions from JSON!`, 'success');
            document.getElementById('json-file').value = '';
        } catch (error) {
            console.error('Error importing JSON:', error);
            showNotification('Error importing JSON file. Please check the file format.', 'error');
        }
    };

    reader.onerror = function () {
        showNotification('Error reading the JSON file. Please try again.', 'error');
    };

    reader.readAsText(file);
}

// Add event listeners for JSON import/export buttons
document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
document.getElementById('import-json-btn').addEventListener('click', () => {
    document.getElementById('json-file').click();
});
document.getElementById('json-file').addEventListener('change', importFromJSON);

// Add the notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
    // Initialize existing event listeners
    addTransactionBtn.addEventListener('click', addTransaction);
    categoryFilterEl.addEventListener('change', updateUI);
    recurringCheckbox.addEventListener('change', () => {
        recurringIntervalEl.disabled = !recurringCheckbox.checked;
    });

    // Add CSV import/export event listeners
    document.getElementById('import-csv-btn').addEventListener('click', function () {
        console.log('Import button clicked');
        document.getElementById('csv-file').click();
    });
    document.getElementById('csv-file').addEventListener('change', function (event) {
        console.log('File selected:', event.target.files[0]);
        importFromCSV(event);
    });

    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

    function showDeleteConfirmationModal() {
        const transactionListEl = document.getElementById('transaction-list');
        const transactionEls = transactionListEl.querySelectorAll('.transaction-item');

        // Check if there are any transactions
        if (transactionEls.length === 0) {
            showNoTransactionsMessage();
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal">
                <div class="modal-content delete-all-modal">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete all transactions? This action cannot be undone.</p>
                    <div class="modal-buttons">
                        <button id="confirm-delete" class="btn btn-danger">Delete All</button>
                        <button id="cancel-delete" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

        `;
        document.body.appendChild(modal);

        document.getElementById('confirm-delete').addEventListener('click', () => {
            modal.remove();
            deleteAllTransactions();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            modal.remove();
        });
    }

    function showNoTransactionsMessage() {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content no-transactions">
                <div class="modal-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h2>No Transactions</h2>
                <p>There are no transactions to delete.</p>
                <div class="modal-buttons">
                    <button id="ok-button" class="btn btn-primary">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('ok-button').addEventListener('click', () => {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 500);
        });

        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.classList.add('fade-out');
            }
        }, 2500);

        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 3000);
    }


    // Function to delete all transactions
    function deleteAllTransactions() {
        const transactionListEl = document.getElementById('transaction-list');
        const transactionEls = transactionListEl.querySelectorAll('.transaction-item');
        const transactionLength = transactionEls.length;

        if (transactionLength === 0) return;

        // Create and add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Deleting transactions...</p>
    `;
        transactionListEl.appendChild(loadingIndicator);

        let deleteTimer;
        let isBulkDeleteTriggered = false;

        // Function to delete remaining transactions in bulk
        function bulkDeleteRemaining() {
            if (isBulkDeleteTriggered) return;
            isBulkDeleteTriggered = true;

            transactions = []; // Clear all transactions
            localStorage.setItem('transactions', JSON.stringify(transactions)); // Update local storage
            updateUI(); // Update the UI after deletion
            loadingIndicator.remove(); // Remove loading indicator
            showNotification('All transactions deleted successfully', 'success');
        }

        // Add deleting class to all transactions with a slight delay between each
        transactionEls.forEach((transactionEl, index) => {
            setTimeout(() => {
                transactionEl.classList.add('deleting');
                // Check if the delete timer has expired
                if (isBulkDeleteTriggered) return;
            }, index * 100); // Delay each transaction deletion slightly
        });

        // Start the timer, bulk delete after 3 seconds
        deleteTimer = setTimeout(bulkDeleteRemaining, 3000);

        // Ensure final deletion after the last animation
        setTimeout(() => {
            if (!isBulkDeleteTriggered) bulkDeleteRemaining();
        }, transactionLength * 100 + 500); // Time to ensure animations complete + a small buffer
    }

    // Bind the deleteAll function to your delete button
    deleteAllBtn.addEventListener('click', showDeleteConfirmationModal);


    const style = document.createElement('style');
    style.textContent = `
        ${style.textContent}
        
        .custom-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
    
        .modal-content {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
    
        .modal-content h2 {
            margin-top: 0;
            color: #333;
        }
    
        .modal-content p {
            margin-bottom: 1.5rem;
            color: #666;
        }
    
        .modal-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
        }
    
        .modal-buttons button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.3s;
        }
    
        .modal-buttons .btn-danger {
            background-color: #dc3545;
            color: white;
        }
    
        .modal-buttons .btn-danger:hover {
            background-color: #c82333;
        }
    
        .modal-buttons .btn-secondary {
            background-color: #6c757d;
            color: white;
        }
    
        .modal-buttons .btn-secondary:hover {
            background-color: #5a6268;
        }
    `;
    document.head.appendChild(style);
    // Initial UI update
    updateUI();
});

function showLoadingIndicator() {
    const transactionList = document.getElementById('transaction-list');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-indicator';
    loadingEl.innerHTML = `
        <div class="spinner"></div>
        <p>Deleting transactions...</p>
    `;
    transactionList.appendChild(loadingEl);

    return loadingEl;
}

document.addEventListener('DOMContentLoaded', function () {
    // Other initialization code
    processRecurringTransactions();
    updateUI();
});

window.onload = function () {
    // Clear all form fields on page load
    descriptionEl.value = '';
    amountEl.value = '';
    transactionTypeEl.value = 'income';
    categoryEl.value = 'Salary';
    recurringCheckbox.checked = false;
    recurringIntervalEl.disabled = true;
    recurringIntervalEl.value = 'daily';
};

// Function to update all currency symbols on the page
function updateCurrencySymbols() {
    const symbol = currencySymbols[currentCurrency];

    // Update all elements that display the currency symbol, ensuring no duplicates
    document.querySelectorAll('.currency-symbol').forEach(el => {
        // Replace the symbol in the HTML to avoid duplicates
        el.textContent = symbol;
    });

    // Update UI elements like balance, income, expenses by reformatting the amounts
    updateUI();
}

// Function to handle currency change
function changeCurrency(newCurrency) {
    currentCurrency = newCurrency;
    localStorage.setItem('currency', newCurrency);  // Save the currency in localStorage
    updateCurrencySymbols();  // Update symbols on the page
}

// Event listeners for currency buttons
document.getElementById('currency-usd').addEventListener('click', () => changeCurrency('usd'));
document.getElementById('currency-eur').addEventListener('click', () => changeCurrency('eur'));
document.getElementById('currency-gbp').addEventListener('click', () => changeCurrency('gbp'));

// Format the amount with the current currency symbol
function formatAmount(amount) {
    const symbol = currencySymbols[currentCurrency];
    // Use toLocaleString for comma separation
    return `${symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Call updateCurrencySymbols on page load to apply the correct currency
document.addEventListener('DOMContentLoaded', function () {
    updateCurrencySymbols();
});

document.addEventListener('DOMContentLoaded', () => {
    const optionsToggle = document.getElementById('options-toggle');
    const currencyPopup = document.getElementById('currency-popup');

    // Toggle pop-up visibility on clicking the Options button
    optionsToggle.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating and immediately closing the popup
        currencyPopup.classList.toggle('show');
    });

    // Close the popup when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!currencyPopup.contains(event.target) && !optionsToggle.contains(event.target)) {
            currencyPopup.classList.remove('show');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info');
    const infoPopup = document.getElementById('info-popup');
    const closeInfoButton = document.getElementById('close-info');

    infoButton.addEventListener('click', () => {
        // Store the button's original position
        const buttonRect = infoButton.getBoundingClientRect();
        infoButton.style.transformOrigin = `${buttonRect.width / 2}px ${buttonRect.height / 2}px`;

        // Start the animation
        infoButton.classList.add('animating');

        // Show popup after button animation
        setTimeout(() => {
            infoPopup.classList.add('show');
        }, 10); // Match this with the animation duration

        // Reset button after animation complete
        setTimeout(() => {
            infoButton.classList.remove('animating');
            infoButton.style.opacity = '1';
        }, 20);
    });

    function closePopup() {
        infoPopup.classList.remove('show');
        infoButton.style.opacity = '1';
    }

    closeInfoButton.addEventListener('click', closePopup);

    // Close the popup when clicking outside of it
    infoPopup.addEventListener('click', (event) => {
        if (event.target === infoPopup) {
            closePopup();
        }
    });
});

function showNoExportModal(exportType) {
    const modal = document.getElementById('no-export-modal');
    const modalText = document.getElementById('no-export-modal-text');

    // Customize the message based on export type
    modalText.textContent = `No transactions available to export as ${exportType}.`;

    // Show the modal
    modal.style.display = 'flex';
    modal.classList.remove('fade-out');
    modal.classList.add('fade-in');

    // Close the modal after a few seconds or on button click
    const closeModalBtn = document.getElementById('close-no-export-modal');
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('fade-in');
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
        }, 500);
    });

    setTimeout(() => {
        modal.classList.remove('fade-in');
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 500);
    }, 3000); // Auto-close after 3 seconds
}

document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
document.getElementById('export-json-btn').addEventListener('click', exportToJSON);

function updateIncomeExpenseTrendsChart() {
    const chartCanvas = document.getElementById('incomeExpenseTrendsChart');
    const noDataMessage = document.getElementById('no-data-trends');
    const ctx = chartCanvas.getContext('2d');

    if (transactions.length === 0) {
        chartCanvas.style.display = 'none';
        noDataMessage.style.display = 'block';
        return;
    } else {
        chartCanvas.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    const incomeTransactions = transactions.filter(transaction => transaction.type === 'income');
    const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

    // Group transactions by date (e.g., daily)
    const groupedData = groupTransactionsByDate(transactions);

    const dates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));
    const incomeData = dates.map(date => groupedData[date].income || 0);
    const expenseData = dates.map(date => groupedData[date].expenses || 0);

    // Check if the chart already exists and is a Chart instance, then destroy it
    if (window.incomeExpenseTrendsChart && window.incomeExpenseTrendsChart instanceof Chart) {
        window.incomeExpenseTrendsChart.destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#2d3748'; // Darker text for light mode
    const backgroundColor = isDarkMode ? '#2d3748' : '#f7fafc'; // A light grey background for light mode
    const gridLineColor = isDarkMode ? '#4a5568' : '#cbd5e0'; // Darker grid for light mode

    // Set the background of the canvas
    chartCanvas.style.backgroundColor = backgroundColor;

    const symbol = currencySymbols[currentCurrency];

    // Create a new Chart instance
    window.incomeExpenseTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: `Income (${symbol})`,
                    data: incomeData,
                    borderColor: 'rgba(75, 192, 192, 1)', // Color for income line
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Slight fill
                    fill: true,
                    tension: 0.1
                },
                {
                    label: `Expenses (${symbol})`,
                    data: expenseData,
                    borderColor: 'rgba(229, 62, 62, 1)', // Color for expense line
                    backgroundColor: 'rgba(229, 62, 62, 0.2)', // Slight fill
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor // Adjust text color for light/dark mode
                    },
                    grid: {
                        color: gridLineColor // Adjust grid color for light/dark mode
                    }
                },
                x: {
                    ticks: {
                        color: textColor // Adjust text color for light/dark mode
                    },
                    grid: {
                        color: gridLineColor // Adjust grid color for light/dark mode
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor // Adjust text color for light/dark mode
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function groupTransactionsByDate(transactions) {
    const groupedData = {};

    transactions.forEach(transaction => {
        const timestamp = transaction.timestamp;
        const date = new Date(timestamp);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.error(`Invalid date found: ${timestamp}`);
            return; // Skip this transaction
        }

        const dateStr = date.toISOString().split('T')[0];

        if (!groupedData[dateStr]) {
            groupedData[dateStr] = { income: 0, expenses: 0 };
        }

        if (transaction.type === 'income') {
            groupedData[dateStr].income += transaction.amount;
        } else if (transaction.type === 'expense') {
            groupedData[dateStr].expenses += transaction.amount;
        }
    });

    return groupedData;
}


document.addEventListener('DOMContentLoaded', function () {
    const heartIcon = document.getElementById('financial-heart');
    const tooltip = document.querySelector('.tooltip');
    const healthPercentageEl = document.getElementById('health-percentage');

    // Fetch actual income and expenses from your transactions
    let income = transactions
        .filter(transaction => transaction && transaction.type === 'income')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    let expenses = transactions
        .filter(transaction => transaction && transaction.type === 'expense')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    // Convert to numbers if they aren't already
    income = Number(income);
    expenses = Number(expenses);

    // Prevent division by zero and ensure numbers are valid
    function calculateHealthPercentage(expenses, income) {
        if (income === 0) {
            return 0; // If there's no income, financial health is 0%
        }
        let health = ((income - expenses) / income) * 100;
        return Math.max(0, Math.min(100, health.toFixed(2))); // Ensure percentage is between 0 and 100
    }

    // Update the tooltip content dynamically
    function updateTooltip() {
        const healthPercentage = calculateHealthPercentage(expenses, income);
        healthPercentageEl.textContent = `${healthPercentage}%`;
    }

    // Toggle tooltip visibility on heart click
    heartIcon.addEventListener('click', (event) => {
        event.stopPropagation();  // Prevent click from closing tooltip immediately
        const financialStatusDiv = heartIcon.parentElement;
        if (!financialStatusDiv.classList.contains('active')) {
            financialStatusDiv.classList.add('active');
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1'; // Fade in
        } else {
            financialStatusDiv.classList.remove('active');
            tooltip.style.opacity = '0'; // Start fade out
            setTimeout(() => {
                tooltip.style.visibility = 'hidden';
            }, 300); // Wait for the opacity transition to finish
        }
        updateTooltip();  // Update tooltip content
    });

    // Close the tooltip when clicking outside
    document.addEventListener('click', (event) => {
        const financialStatusDiv = heartIcon.parentElement;
        if (!financialStatusDiv.contains(event.target)) {
            financialStatusDiv.classList.remove('active'); // Hide tooltip
            tooltip.style.opacity = '0'; // Start fade out
            setTimeout(() => {
                tooltip.style.visibility = 'hidden';
            }, 300); // Wait for the opacity transition to finish
        }
    });
});
console.log('Transactions:', transactions);
