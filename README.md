# 💰 Money Tracker - Savings Calculator

A simple, powerful web app to track your income, expenses, and project your savings goals with visual uncertainty ranges.

## Features

- **Income Tracking**: Record multiple paystubs with amounts and pay periods
- **Balance Management**: Track your current bank account balance
- **Expense Tracking**: 
  - Fixed monthly expenses (rent, utilities, subscriptions)
  - Variable daily charges with dates
- **Savings Goals**: Set a target amount and see how long it will take to reach it
- **Visual Projections**: Beautiful chart showing:
  - Projected balance over 12 months
  - Uncertainty "cones" (best case and worst case scenarios)
  - Your savings goal line
- **Statistics Dashboard**: Quick overview of your financial situation

## How to Use

1. **Open the App**: Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge)

2. **Enter Your Income**:
   - Click "Add Paystub" to add income entries
   - Input the amount from each paystub
   - Set the pay period dates (typically a 2-week period)
   - Add multiple paystubs to track all income sources
   - Click "Remove Paystub" to delete any paystub entry

3. **Enter Your Current Balance**:
   - Input your current bank account balance

4. **Add Monthly Expenses**:
   - Enter your total fixed monthly expenses (rent, utilities, subscriptions, etc.)

5. **Add Daily Charges**:
   - Click "Add Daily Charge" to add each expense
   - Enter the date and amount for each charge
   - Add as many as you need to track
   - Click "Remove" to delete any charge

6. **Set Your Savings Goal**:
   - Enter the amount you're trying to save up to

7. **Calculate**:
   - Click "Calculate Savings Projection"
   - View your statistics and projection chart
   - See how long it will take to reach your goal

## Understanding the Chart

The chart shows three lines:

- **Projected Balance (Blue)**: Your expected balance based on current income and expenses
- **Upper Bound (Green, dashed)**: Best-case scenario with lower-than-average variable expenses
- **Lower Bound (Red, dashed)**: Worst-case scenario with higher-than-average variable expenses
- **Savings Goal (Orange, dashed)**: Your target savings amount

The shaded area between the upper and lower bounds represents the "uncertainty cone" - the range where your actual balance is likely to fall based on variable spending patterns.

## Technical Details

- **Pure Frontend**: No server required - runs entirely in your browser
- **No Data Storage**: All data is temporary and stays in your browser session
- **Libraries Used**: Chart.js for visualization
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Privacy

This app runs entirely in your browser. No data is sent to any server or stored anywhere. Your financial information remains completely private.

## Browser Compatibility

Works with all modern browsers (released within the last 2-3 years):
- Chrome/Edge
- Firefox
- Safari
- Opera

## License

MIT License - Feel free to use and modify as needed.