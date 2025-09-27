﻿# Snobify 😏🎧

> Your Music Taste, Judged

A local-first "Spotify Wrapped" alternative that analyzes your music listening data and provides snarky, animated statistics cards with PDF export capabilities. Multi-profile, lifetime scope, months/years trends.

##  What is Snobify?

Snobify is a pretentious music taste analyzer that takes your Spotify listening data and delivers brutally honest (but hilariously accurate) commentary on your musical preferences. Think of it as having a music snob friend who judges your taste while providing genuinely interesting insights about your listening habits.

### Key Features

- ** The Snob Character**: A witty, pretentious music critic who provides commentary throughout your analysis
- **📊 Comprehensive Analytics**: Deep dive into your listening patterns, genre preferences, and music discovery habits
- **🎨 Beautiful UI**: Modern, vibrant interface with smooth animations and responsive design
- **📱 Multi-Profile Support**: Analyze multiple users' data with separate profiles
- **📄 Export Capabilities**: Generate PDF reports and shareable images of your music taste
- ** Rarity Analysis**: Discover how mainstream or underground your taste really is
- ** Taste Profiling**: Detailed analysis of your music attributes (danceability, energy, valence, etc.)
- ** Advanced Debugging**: Comprehensive error handling and debugging tools for developers

## 🏗️ Architecture

Snobify is built as a full-stack application with a clear separation of concerns:

```
Snobify/
├── app/                    # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # React components & UI
│   │   ├── api/           # API client & connection management
│   │   ├── engine/        # Scene engine & transitions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utilities & debug logger
│   │   └── types.ts       # TypeScript type definitions
│   └── package.json
├── server/                 # Node.js backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── compute/       # Data analysis algorithms
│   │   ├── ingest/        # CSV parsing and data processing
│   │   ├── ml/            # Machine learning components
│   │   ├── middleware/    # Connection & performance middleware
│   │   ├── health/        # Health checking system
│   │   ├── errors/        # Error handling
│   │   └── index.ts       # Main server entry point
│   └── package.json
├── profiles/              # User data storage
│   └── default/
│       └── history.csv    # Spotify export data
├── Music data/            # Spotify playlist exports
├── scripts/               # PowerShell automation scripts
├── common/                # Shared types and utilities
└── docs/                  # Documentation
```
<code_block_to_apply_changes_from>
app/src/
├── components/
│   ├── WelcomePage.tsx          # Landing page
│   ├── SummaryDashboard.tsx     # Main statistics view
│   ├── RarityAnalysis.tsx       # Rarity and underground analysis
│   ├── TasteProfile.tsx         # Detailed taste analysis
│   ├── ErrorBoundary.tsx        # Error handling component
│   └── DebugPanel.tsx           # Debug interface
├── api/
│   └── client.ts                # API client with error handling
├── utils/
│   └── debugLogger.ts           # Comprehensive logging system
└── types.ts                     # TypeScript definitions

server/src/
├── compute/
│   ├── compute.ts               # Main statistics computation
│   ├── playlistRatings.ts       # Playlist analysis
│   ├── tasteProfile.ts          # Taste profile generation
│   └── libraryAnalysis.ts       # Library-wide analysis
├── ingest/
│   ├── readCsv.ts               # CSV parsing utility
│   └── readAll.ts               # Multi-file CSV processor
└── index.ts                     # Server entry point
```

### API Endpoints

- `GET /api/health` - Check the server's health status
- `GET /api/playlist-scores` - Get playlist ratings
- `GET /api/ml-analysis` - Get combined ML analysis results
- `GET /api/genre-classification` - Classify tracks by genre
- `GET /api/mood-prediction` - Predict mood for tracks
- `POST /api/mood-training` - Train the mood prediction model
- `GET /api/artist-clustering` - Cluster artists based on listening habits
- `GET /api/recommendations` - Generate track recommendations
- `GET /metrics` - Server metrics (Prometheus format)

### Debugging Features

Snobify includes comprehensive debugging tools:

- **Error Boundaries**: Catch and display React errors gracefully
- **Debug Logger**: Categorized logging with different levels
- **Debug Panel**: Real-time log viewer (Ctrl+Shift+D)
- **API Logging**: Detailed request/response logging
- **Error Persistence**: Save errors to localStorage for debugging
- **Export Logs**: Export debug information for bug reports

### Running in Development

```bash
# Install all dependencies for both app and server
npm run install-all

# Start both the frontend and backend servers concurrently
npm start

# --- Alternatively, run them in separate terminals ---

# Run the backend server
npm run server

# Run the frontend app
npm run app
```

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests if applicable**
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- **TypeScript**: Use strict mode and proper typing
- **React**: Functional components with hooks
- **CSS**: Use CSS custom properties and modern features
- **Error Handling**: Always include proper error boundaries

### Testing
> Note: Test scripts are not yet configured in the root `package.json`. To run tests, you will need to navigate to the `app` or `server` directory and run their respective test commands.
>
> ```bash
> # Example for running server tests
> cd server && npm test
> ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Spotify**: For providing the data export functionality
- **React Team**: For the amazing frontend framework
- **Fastify Team**: For the fast and efficient backend framework
- **Vite Team**: For the lightning-fast build tool
- **All Contributors**: Who help make Snobify better

## 📞 Support

### Getting Help

- **Documentation**: Check this README and the docs/ folder
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### Reporting Bugs

When reporting bugs, please include:

1. **Error ID**: From the debug panel or error boundary
2. **Steps to Reproduce**: Detailed steps to recreate the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **System Information**: OS, Node.js version, browser
6. **Debug Logs**: Export from the debug panel

### Feature Requests

We welcome feature requests! Please include:

1. **Use Case**: Why this feature would be useful
2. **Proposed Solution**: How you envision it working
3. **Alternatives**: Other ways to solve the problem
4. **Additional Context**: Any other relevant information

---

**Made with ❤️ and a healthy dose of musical snobbery**

*"Your taste has been thoroughly analyzed, and the results are... unfortunate."* - The Snob
```

This comprehensive README covers:

1. **Project Overview** - What Snobify is and why it exists
2. **Architecture** - Technical details and project structure
3. **Quick Start** - Easy setup instructions
4. **Data Requirements** - What data is needed and how to get it
5. **User Interface** - Detailed explanation of each page
6. **Development** - How to contribute and develop
7. **The Snob Character** - Explanation of the personality
8. **Analytics** - What insights the app provides
9. **Privacy** - Data handling and local-first approach
10. **Troubleshooting** - Common issues and solutions
11. **Contributing** - How to help improve the project
12. **Support** - How to get help and report issues

The README is structured to be helpful for both users who want to use the app and developers who want to understand or contribute to the codebase.