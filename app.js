// State management
let dailyCharges = [];
let chart = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set default dates
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    document.getElementById('payPeriodStart').valueAsDate = twoWeeksAgo;
    document.getElementById('payPeriodEnd').valueAsDate = today;
    
    // Event listeners
    document.getElementById('addChargeBtn').addEventListener('click', addDailyCharge);
    document.getElementById('calculateBtn').addEventListener('click', calculateProjection);
    
    // Add initial charge field
    addDailyCharge();
}

// Add a new daily charge input
function addDailyCharge() {
    const chargesList = document.getElementById('dailyChargesList');
    const chargeId = Date.now();
    
    const chargeItem = document.createElement('div');
    chargeItem.className = 'charge-item';
    chargeItem.dataset.id = chargeId;
    
    chargeItem.innerHTML = `
        <input type="date" class="charge-date" placeholder="Date">
        <input type="number" class="charge-amount" placeholder="Amount ($)" step="0.01" min="0">
        <button class="btn-danger" onclick="removeDailyCharge(${chargeId})">Remove</button>
    `;
    
    chargesList.appendChild(chargeItem);
}

// Remove a daily charge
function removeDailyCharge(chargeId) {
    const chargeItem = document.querySelector(`[data-id="${chargeId}"]`);
    if (chargeItem) {
        chargeItem.remove();
    }
}

// Get all daily charges from the form
function getDailyCharges() {
    const charges = [];
    const chargeItems = document.querySelectorAll('.charge-item');
    
    chargeItems.forEach(item => {
        const date = item.querySelector('.charge-date').value;
        const amount = parseFloat(item.querySelector('.charge-amount').value);
        
        if (date && amount > 0) {
            charges.push({ date, amount });
        }
    });
    
    return charges;
}

// Calculate the projection
function calculateProjection() {
    // Get input values
    const paystubAmount = parseFloat(document.getElementById('paystubAmount').value) || 0;
    const currentBalance = parseFloat(document.getElementById('currentBalance').value) || 0;
    const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value) || 0;
    const savingsGoal = parseFloat(document.getElementById('savingsGoal').value) || 0;
    const dailyCharges = getDailyCharges();
    
    // Validation
    if (paystubAmount === 0) {
        alert('Please enter your paystub amount');
        return;
    }
    
    // Calculate average daily charges
    const totalDailyCharges = dailyCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const avgDailyCharge = dailyCharges.length > 0 ? totalDailyCharges / dailyCharges.length : 0;
    
    // Calculate monthly income (2 paychecks per month approximately)
    const monthlyIncome = paystubAmount * 2;
    
    // Calculate monthly variable expenses (daily charges * 30)
    const monthlyVariableExpenses = avgDailyCharge * 30;
    
    // Calculate net monthly savings
    const netMonthlySavings = monthlyIncome - monthlyExpenses - monthlyVariableExpenses;
    
    // Update stats
    document.getElementById('statIncome').textContent = `$${paystubAmount.toFixed(2)}`;
    document.getElementById('statExpenses').textContent = `$${monthlyExpenses.toFixed(2)}`;
    document.getElementById('statDailyCharges').textContent = `$${avgDailyCharge.toFixed(2)}`;
    document.getElementById('statNetSavings').textContent = `$${netMonthlySavings.toFixed(2)}`;
    
    // Calculate time to reach goal
    if (savingsGoal > 0 && netMonthlySavings > 0) {
        const remainingAmount = savingsGoal - currentBalance;
        const monthsToGoal = Math.ceil(remainingAmount / netMonthlySavings);
        
        if (monthsToGoal > 0) {
            const years = Math.floor(monthsToGoal / 12);
            const months = monthsToGoal % 12;
            let timeText = '';
            
            if (years > 0) {
                timeText += `${years} year${years > 1 ? 's' : ''}`;
            }
            if (months > 0) {
                if (timeText) timeText += ' and ';
                timeText += `${months} month${months > 1 ? 's' : ''}`;
            }
            
            document.getElementById('goalTimeframe').textContent = 
                `You'll reach your goal of $${savingsGoal.toFixed(2)} in approximately ${timeText}`;
        } else {
            document.getElementById('goalTimeframe').textContent = 
                `You've already reached your goal! 🎉`;
        }
    } else if (savingsGoal > 0 && netMonthlySavings <= 0) {
        document.getElementById('goalTimeframe').textContent = 
            `Your expenses exceed your income. You won't reach your goal without reducing expenses or increasing income.`;
    } else {
        document.getElementById('goalTimeframe').textContent = 
            `Set a savings goal to see your timeline`;
    }
    
    // Generate projection data for chart
    generateChart(currentBalance, netMonthlySavings, monthlyVariableExpenses, savingsGoal);
    
    // Show results
    document.getElementById('resultsSection').classList.remove('results-hidden');
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Generate the savings projection chart with uncertainty cones
function generateChart(startingBalance, monthlySavings, variableExpenses, savingsGoal) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Generate projection for 12 months
    const months = 12;
    const labels = [];
    const projectedData = [];
    const upperBoundData = [];
    const lowerBoundData = [];
    
    // Calculate uncertainty based on variable expenses (±20% variance)
    const uncertaintyFactor = 0.20;
    
    for (let i = 0; i <= months; i++) {
        labels.push(i === 0 ? 'Now' : `Month ${i}`);
        
        const baseProjection = startingBalance + (monthlySavings * i);
        const uncertainty = variableExpenses * uncertaintyFactor * i;
        
        projectedData.push(baseProjection);
        upperBoundData.push(baseProjection + uncertainty);
        lowerBoundData.push(Math.max(0, baseProjection - uncertainty));
    }
    
    // Prepare datasets
    const datasets = [
        {
            label: 'Projected Balance',
            data: projectedData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Upper Bound (Best Case)',
            data: upperBoundData,
            borderColor: 'rgba(76, 175, 80, 0.5)',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: '+1',
            tension: 0.1,
            pointRadius: 0
        },
        {
            label: 'Lower Bound (Worst Case)',
            data: lowerBoundData,
            borderColor: 'rgba(244, 67, 54, 0.5)',
            backgroundColor: 'rgba(244, 67, 54, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: '-1',
            tension: 0.1,
            pointRadius: 0
        }
    ];
    
    // Add goal line if set
    if (savingsGoal > 0) {
        datasets.push({
            label: 'Savings Goal',
            data: Array(months + 1).fill(savingsGoal),
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderDash: [10, 5],
            fill: false,
            pointRadius: 0
        });
    }
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Savings Projection with Uncertainty Range (12 Months)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Balance ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });
}
