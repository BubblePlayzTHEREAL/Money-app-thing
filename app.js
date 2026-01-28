// State management
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
        <button class="btn-danger" data-charge-id="${chargeId}">Remove</button>
    `;
    
    chargesList.appendChild(chargeItem);
    
    // Add event listener to the remove button
    const removeBtn = chargeItem.querySelector('.btn-danger');
    removeBtn.addEventListener('click', function() {
        removeDailyCharge(chargeId);
    });
}

// Remove a daily charge
function removeDailyCharge(chargeId) {
    const chargeItem = document.querySelector(`[data-id="${chargeId}"]`);
    if (chargeItem) {
        chargeItem.remove();
    }
}

// Show error message
function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #f44336; color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; font-weight: 600;';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        errorDiv.style.transition = 'opacity 0.3s';
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
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
        showError('Please enter your paystub amount');
        return;
    }
    
    // Calculate average daily charges
    const totalDailyCharges = dailyCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const avgDailyCharge = dailyCharges.length > 0 ? totalDailyCharges / dailyCharges.length : 0;
    
    // Calculate monthly income (biweekly pay = 26 pay periods per year)
    const monthlyIncome = paystubAmount * 26 / 12;
    
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
    
    // Check if Chart.js is available
    if (typeof Chart !== 'function') {
        // Fallback to text-based visualization
        generateTextChart(ctx, startingBalance, monthlySavings, variableExpenses, savingsGoal);
        return;
    }
    
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
    // This represents typical fluctuation in variable spending patterns
    const UNCERTAINTY_FACTOR = 0.20;
    
    for (let i = 0; i <= months; i++) {
        labels.push(i === 0 ? 'Now' : `Month ${i}`);
        
        const baseProjection = startingBalance + (monthlySavings * i);
        const uncertainty = variableExpenses * UNCERTAINTY_FACTOR * i;
        
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
            fill: {
                target: 0,
                above: 'rgba(76, 175, 80, 0.1)'
            },
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
            fill: {
                target: 0,
                below: 'rgba(244, 67, 54, 0.1)'
            },
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

// Fallback text-based chart when Chart.js is not available
function generateTextChart(ctx, startingBalance, monthlySavings, variableExpenses, savingsGoal) {
    const canvas = ctx.canvas;
    
    // Set canvas dimensions based on container size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 400;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Generate projection data
    const months = 12;
    const UNCERTAINTY_FACTOR = 0.20;
    const projections = [];
    
    for (let i = 0; i <= months; i++) {
        const baseProjection = startingBalance + (monthlySavings * i);
        const uncertainty = variableExpenses * UNCERTAINTY_FACTOR * i;
        projections.push({
            month: i,
            base: baseProjection,
            upper: baseProjection + uncertainty,
            lower: Math.max(0, baseProjection - uncertainty)
        });
    }
    
    // Find min and max values for scaling
    const allValues = projections.flatMap(p => [p.upper, p.lower]);
    if (savingsGoal > 0) allValues.push(savingsGoal);
    const minValue = Math.min(...allValues, 0);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;
    
    // Chart dimensions
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    // Helper function to scale y-values
    const scaleY = (value) => {
        return height - padding - ((value - minValue) / valueRange) * chartHeight;
    };
    
    // Helper function to scale x-values
    const scaleX = (month) => {
        return padding + (month / months) * chartWidth;
    };
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines and labels
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const value = minValue + (valueRange * i / ySteps);
        const y = scaleY(value);
        
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        ctx.fillText('$' + value.toFixed(0), padding - 10, y + 4);
    }
    
    // Draw x-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= months; i += 2) {
        const x = scaleX(i);
        ctx.fillText(i === 0 ? 'Now' : `M${i}`, x, height - padding + 20);
    }
    
    // Draw uncertainty cone (filled area)
    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(projections[0].upper));
    for (let i = 0; i <= months; i++) {
        ctx.lineTo(scaleX(i), scaleY(projections[i].upper));
    }
    for (let i = months; i >= 0; i--) {
        ctx.lineTo(scaleX(i), scaleY(projections[i].lower));
    }
    ctx.closePath();
    ctx.fill();
    
    // Draw upper bound line
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(projections[0].upper));
    for (let i = 1; i <= months; i++) {
        ctx.lineTo(scaleX(i), scaleY(projections[i].upper));
    }
    ctx.stroke();
    
    // Draw lower bound line
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.8)';
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(projections[0].lower));
    for (let i = 1; i <= months; i++) {
        ctx.lineTo(scaleX(i), scaleY(projections[i].lower));
    }
    ctx.stroke();
    
    // Draw main projection line
    ctx.strokeStyle = 'rgb(75, 192, 192)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(projections[0].base));
    for (let i = 1; i <= months; i++) {
        ctx.lineTo(scaleX(i), scaleY(projections[i].base));
    }
    ctx.stroke();
    
    // Draw goal line if set
    if (savingsGoal > 0) {
        ctx.strokeStyle = 'rgb(255, 159, 64)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, scaleY(savingsGoal));
        ctx.lineTo(width - padding, scaleY(savingsGoal));
        ctx.stroke();
    }
    
    // Draw legend - dynamically positioned based on canvas width
    ctx.setLineDash([]);
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const legendY = 30;
    const legendSpacing = Math.min(150, width / 5); // Responsive spacing
    
    // Projected Balance
    ctx.fillStyle = 'rgb(75, 192, 192)';
    ctx.fillRect(padding, legendY, 20, 3);
    ctx.fillStyle = '#333';
    ctx.fillText('Projected Balance', padding + 25, legendY + 4);
    
    // Upper Bound
    ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
    ctx.fillRect(padding + legendSpacing, legendY, 20, 3);
    ctx.fillStyle = '#333';
    ctx.fillText('Upper Bound', padding + legendSpacing + 25, legendY + 4);
    
    // Lower Bound
    ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
    ctx.fillRect(padding + legendSpacing * 2, legendY, 20, 3);
    ctx.fillStyle = '#333';
    ctx.fillText('Lower Bound', padding + legendSpacing * 2 + 25, legendY + 4);
    
    if (savingsGoal > 0 && width > 600) {
        ctx.fillStyle = 'rgb(255, 159, 64)';
        ctx.fillRect(padding + legendSpacing * 3, legendY, 20, 3);
        ctx.fillStyle = '#333';
        ctx.fillText('Goal', padding + legendSpacing * 3 + 25, legendY + 4);
    }
    
    // Title
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Savings Projection with Uncertainty Range (12 Months)', width / 2, 15);
}
