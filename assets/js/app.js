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

function saveEditedTransaction() {
    const updatedDescription = editDescriptionEl.value.trim();
    const updatedAmount = parseFloat(editAmountEl.value);
    const updatedType = editTransactionTypeEl.value;
    const updatedCategory = editCategoryEl.value;
    const updatedIsRecurring = editRecurringCheckbox.checked;
    const updatedRecurringInterval = updatedIsRecurring ? editRecurringIntervalEl.value : null;

    if (!updatedDescription || isNaN(updatedAmount)) {
        showNotification('Please enter valid description and amount', 'error');
        return;
    }

    // Get the current transaction
    const currentTransaction = transactions[editIndex];

    // Prepare the updated transaction
    const updatedTransaction = {
        ...currentTransaction,
        description: updatedDescription,
        amount: updatedAmount,
        type: updatedType,
        category: updatedCategory,
        isRecurring: updatedIsRecurring,
        recurringInterval: updatedRecurringInterval,
    };

    // If changing from non-recurring to recurring, add necessary properties
    if (updatedIsRecurring && !currentTransaction.isRecurring) {
        updatedTransaction.initialAmount = updatedAmount;
        updatedTransaction.lastAddedDate = new Date().toISOString();
    }

    // If changing from recurring to non-recurring, remove recurring-specific properties
    if (!updatedIsRecurring && currentTransaction.isRecurring) {
        delete updatedTransaction.initialAmount;
        delete updatedTransaction.lastAddedDate;
        delete updatedTransaction.recurringInterval;
    }

    // Update the transaction in the array
    transactions[editIndex] = updatedTransaction;

    // Save updated transactions to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update the UI and charts
    updateUI();
    closeEditModal();
    
    // Show appropriate notification
    if (!currentTransaction.isRecurring && updatedIsRecurring) {
        showNotification('Transaction updated and set to recurring!', 'success');
    } else if (currentTransaction.isRecurring && !updatedIsRecurring) {
        showNotification('Transaction updated and set to non-recurring!', 'success');
    } else {
        showNotification('Transaction updated successfully!', 'success');
    }
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
editModal.addEventListener('click', function(event) {
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Event listener for recurring checkbox in edit modal
editRecurringCheckbox.addEventListener('change', function() {
    editRecurringIntervalEl.disabled = !this.checked;
    
    // If checked, ensure a default interval is selected
    if (this.checked && !editRecurringIntervalEl.value) {
        editRecurringIntervalEl.value = 'monthly';
    }
});

// Update the saveEditedTransaction function
function saveEditedTransaction() {
    const updatedDescription = editDescriptionEl.value.trim();
    const updatedAmount = parseFloat(editAmountEl.value);
    const updatedType = editTransactionTypeEl.value;
    const updatedCategory = editCategoryEl.value;
    const updatedIsRecurring = editRecurringCheckbox.checked;
    const updatedRecurringInterval = updatedIsRecurring ? editRecurringIntervalEl.value : null;

    if (!updatedDescription || isNaN(updatedAmount)) {
        showNotification('Please enter valid description and amount', 'error');
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

    // If no data, hide chart and show "No data found"
    if (expenseData.every(amount => amount === 0)) {
        chartCanvas.style.display = 'none';
        noDataMessage.style.display = 'block';
        return;
    } else {
        chartCanvas.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#000000';

    expenseCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseCategories,
            datasets: [{
                label: 'Amount ($)',
                data: expenseData,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('FF', 'AA')),
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
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
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
    const textColor = isDarkMode ? '#ffffff' : '#000000';

    transactionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount ($)',
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                }
            },
            responsive: true,
        }
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
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateChart();
    updateExpenseCategoryChart();
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

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

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

    // Filter out null or undefined transactions before sorting
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

    // Update totals and charts
    const balance = income - expenses;
    balanceEl.textContent = formatAmount(balance).replace('$', '');
    incomeTotalEl.textContent = formatAmount(income).replace('$', '');
    expenseTotalEl.textContent = formatAmount(expenses).replace('$', '');

    updateChart();
    updateExpenseCategoryChart();
}

// Function to edit a transaction
function editTransaction(index) {
    openEditModal(index);
}

// Function to add a new transaction
function addTransaction() {
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const type = transactionTypeEl.value;
    const category = categoryEl.value;
    const isRecurring = recurringCheckbox.checked;
    const recurringInterval = isRecurring ? recurringIntervalEl.value : null;

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
        lastAddedDate: isRecurring ? new Date().toISOString() : null,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();

    // Clear form fields
    descriptionEl.value = '';
    amountEl.value = '';
    recurringCheckbox.checked = false;
    recurringIntervalEl.disabled = true;
    recurringIntervalEl.value = 'monthly';

    showNotification('Transaction added successfully!', 'success');
}

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

// Function to export transactions to CSV
function exportToCSV() {
    const csvRows = [];
    const headers = ['Description', 'Amount', 'Type', 'Category', 'IsRecurring', 'RecurringInterval'];
    csvRows.push(headers.join(','));

    transactions.forEach(transaction => {
        const row = [
            `"${transaction.description}"`,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? 'Yes' : 'No',
            transaction.recurringInterval || ''
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

    // Show the success notification after the export is triggered
    showNotification('CSV exported successfully!', 'success');
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

                return {
                    description: columns[0].replace(/"/g, '').trim(),
                    amount: parseFloat(columns[1]),
                    type: columns[2].trim(),
                    category: columns[3].trim(),
                    isRecurring: columns[4].trim() === 'Yes',
                    recurringInterval: columns[5] ? columns[5].trim() : null
                };
            });

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

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(20);
    doc.text("Transaction Report", 10, 10);

    let y = 20;

    doc.setFontSize(12);
    doc.text("Description", 10, y);
    doc.text("Amount", 60, y);
    doc.text("Type", 100, y);
    doc.text("Category", 130, y);
    doc.text("Recurring", 160, y);

    y += 10;

    // Iterate over transactions and add them to the PDF
    transactions.forEach((transaction) => {
        doc.text(transaction.description, 10, y);
        doc.text(transaction.amount.toString(), 60, y);
        doc.text(transaction.type, 100, y);
        doc.text(transaction.category, 130, y);
        doc.text(transaction.isRecurring ? "Yes" : "No", 160, y);
        y += 10;
    });

    // Save the PDF
    doc.save("transactions.pdf");
}


// Add event listener for PDF export button
document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Add a column for isRecurring
    const ws_data = [["Description", "Amount", "Type", "Category", "Recurring"]];
    transactions.forEach((transaction) => {
        ws_data.push([
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? "Yes" : "No"
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Export the workbook
    XLSX.writeFile(wb, "transactions.xlsx");
}


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
            return {
                description: row['Description'],
                amount: parseFloat(row['Amount']),
                type: row['Type'],
                category: row['Category'],
                isRecurring: row['Recurring'] === 'Yes',
                recurringInterval: row['RecurringInterval'] || null
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


// Function to export transactions to JSON
function exportToJSON() {
    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transactions.json');
    a.click();

    showNotification('JSON exported successfully!', 'success');
}

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
    
        // Add deleting class to all transactions with a slight delay between each
        transactionEls.forEach((transactionEl, index) => {
            setTimeout(() => {
                transactionEl.classList.add('deleting');
            }, index * 100);
        });
    
        // After all animations have completed, delete all transactions
        setTimeout(() => {
            transactions = [];
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();
            loadingIndicator.remove();
            showNotification('All transactions deleted successfully', 'success');
    
            // Fade out the modal after deletion is completed
            const modal = document.querySelector('.custom-modal');
            if (modal) {
                modal.classList.add('fade-out');
                setTimeout(() => modal.remove(), 500);
            }
        }, transactionLength * 100 + 500);
    }
    

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
