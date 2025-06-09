# MyCity: City Simulation Sandbox

MyCity is a modern city simulation sandbox app built with React, TypeScript, Vite, and SASS. It features a customizable, grid-based map with smooth panning, zooming, unit switching, a resizable minimap, and a visually accurate scale bar. The app is designed for robust desktop and touch controls, providing a stable and user-friendly UI/UX.

## Features

- **Customizable City Size:** Set city dimensions in miles or kilometers, with instant unit switching and accurate conversion.
- **Grid-Based Map:** Full-screen, high-performance canvas rendering with a visually accurate grid.
- **Smooth Pan & Zoom:** Mouse, touch, and UI controls for panning and zooming, with min/max constraints and continuous action support.
- **Resizable Minimap:** Always matches city aspect ratio, flush to the edge, with draggable/resizable viewport and handles.
- **Scale Bar:** Accurately reflects real-world distances in both mi/ft and km/m, dynamically updates with zoom and unit changes.
- **Robust Controls:** Desktop and touch support, continuous pan/zoom buttons, and a stable, intuitive UI.

## Screenshots

![MyCity Screenshot](public/screenshot.png) <!-- Add a screenshot if available -->

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/MyCity.git
   cd MyCity
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- **Pan/Zoom:** Use mouse, touch, or on-screen controls to pan and zoom the map. Hold pan/zoom buttons for continuous movement.
- **Resize Minimap:** Drag handles on the minimap to resize while maintaining aspect ratio.
- **Switch Units:** Toggle between miles and kilometers in the city size input area.
- **Adjust City Size:** Enter new dimensions to resize the city grid.

## Project Structure

- `src/pages/main/main.page.tsx` — Main logic/UI, minimap, pan/zoom, resizing, and controls
- `src/pages/main/main.styles.sass` — SASS styles for the main page and minimap
- `src/index.sass` — Global styles
- `public/` — Static assets (add a screenshot here for the README)

## Contributing

Contributions are welcome! Please open issues or submit pull requests for new features, bug fixes, or improvements.

## License

[MIT](LICENSE)

---

*Created with Vite, React, TypeScript, and SASS.*
