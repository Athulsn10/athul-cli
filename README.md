# athul-cli

CLI tool for setting up WordPress projects locally using DDEV with AI-powered error handling.

## 🚀 Features

- **Automated System Checks**: Automatically detects OS, Docker, and DDEV status.
- **Project Validation**: Ensures your project follows the required WordPress structure (`wp-content/themes/...`).
- **Interactive Setup**: Guided prompts for starting Docker if it's not running.
- **Smart Error Handling**: Uses Gemini AI to analyze and explain DDEV/Docker errors in plain English.
- **Database Support**: Easy database import from `.sql`, `.sql.gz`, or `.zip` files.
- **Beautiful UI**: Modern, colorful terminal interface with spinners and animations.

## 📋 Prerequisites

Before using this tool, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [DDEV](https://ddev.com/get-started/)

## 🛠️ Installation

You can install the CLI globally:

```bash
npm install -g athul-cli
```

Or run it directly using `npx`:

```bash
npx athul-cli init
```

For development usage:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Link the command globally:
   ```bash
   npm link
   ```

## 📖 Usage

Navigate to your WordPress project directory (must contain `wp-content/themes/`) and run:

```bash
athul init
```

The CLI will:
1. Check your system environment.
2. Validate the project structure.
3. Configure DDEV for WordPress.
4. Attempt to import a database (optional).
5. Launch the project.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
