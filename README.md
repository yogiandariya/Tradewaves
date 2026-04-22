# TradeWaves - Paper Trading Platform

A modern, full-featured paper trading platform built with React that allows users to practice stock trading with virtual money. TradeWaves features a sleek dark theme with professional trading interface design.

## 🚀 Features

### User Features
- **Modern Authentication**: Secure login and registration with glassmorphism design
- **Real-time Stock Search**: Advanced stock search with live data
- **Portfolio Management**:
  - Interactive holdings dashboard
  - Real-time position tracking
  - Smart watchlist management
- **Advanced Trading**:
  - Intuitive buy/sell order placement
  - Comprehensive order history
  - Live position monitoring
- **Professional Dashboard**:
  - Portfolio overview with modern cards
  - Performance analytics
  - Account balance tracking

### Admin Features
- **Admin Dashboard**:
  - User management interface
  - Order monitoring system
  - Balance management tools
  - Product configuration

## 🎨 Design Features

- **Dark Theme**: Professional dark interface optimized for trading
- **Glassmorphism**: Modern glass-like effects throughout the UI
- **Gradient Accents**: Beautiful gradient elements for visual appeal
- **Responsive Design**: Fully responsive across all devices
- **Smooth Animations**: Subtle animations for enhanced UX
- **Trading-Focused Colors**: Green/red color scheme for gains/losses

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Authentication**: Firebase
- **State Management**: Custom React hooks
- **Styling**: Modern CSS with CSS Variables
- **API Integration**: Real-time stock data
- **Fonts**: Inter + JetBrains Mono

## 📁 Project Structure

```
src/
├── Components/
│   ├── AdminDashboard/    # Admin interface components
│   ├── Login/             # Authentication components
│   ├── Registration/      # User registration
│   └── User/              # User interface components
│       ├── Pages/
│       │   ├── Holdings/  # Portfolio holdings
│       │   ├── Order/     # Order management
│       │   ├── searchstock/# Stock search
│       │   └── Watchlist/ # Watchlist management
│       ├── UserNavbar/    # Navigation
│       └── UserFooter/    # Footer
├── config/                # Configuration files
├── hooks/                 # Custom React hooks
└── utils/                 # Utility functions
```

## 🚀 Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd papertrading-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Create a `.env` file in the root directory
   - Add necessary environment variables:
     ```
     VITE_API_KEY=[your-api-key]
     VITE_FIREBASE_CONFIG=[your-firebase-config]
     ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📖 Usage Guide

### User Flow

1. **Registration/Login**
   - Create a new account or login with existing credentials
   - Experience the modern glassmorphism login interface

2. **Stock Search**
   - Use the advanced search functionality to find stocks
   - View real-time stock prices with modern card layouts
   - Add stocks to your personalized watchlist

3. **Trading**
   - Place buy orders with virtual money using intuitive interface
   - Manage open positions with real-time updates
   - Place sell orders with professional trading controls
   - View comprehensive order history

4. **Portfolio Management**
   - Monitor current holdings with modern dashboard cards
   - Track profit/loss with color-coded indicators
   - View performance metrics with interactive charts
   - Manage watchlist with drag-and-drop functionality

### Admin Flow

1. **Dashboard Access**
   - Login with admin credentials
   - Access the professional admin dashboard

2. **User Management**
   - View user list with modern table design
   - Manage user accounts with intuitive controls
   - Monitor user activities in real-time

3. **System Management**
   - Monitor orders with live updates
   - Manage virtual balance with admin tools
   - Configure product settings

## 🎯 Design System

### Color Palette
- **Primary**: Deep blues and purples for professional look
- **Success**: Emerald green for positive changes
- **Danger**: Coral red for negative changes
- **Background**: Dark theme with multiple depth levels

### Typography
- **Primary Font**: Inter for clean, modern readability
- **Monospace**: JetBrains Mono for trading data
- **Weights**: 300-700 for proper hierarchy

### Components
- **Cards**: Glassmorphism with subtle borders
- **Buttons**: Gradient backgrounds with hover effects
- **Inputs**: Dark theme with focus states
- **Tables**: Professional styling with hover effects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real-time price alerts
- [ ] Advanced charting capabilities
- [ ] Social trading features
- [ ] Mobile app development
- [ ] AI-powered trading insights
