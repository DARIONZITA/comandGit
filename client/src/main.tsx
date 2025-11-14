import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import linuxIcon from "@assets/generated_images/linux.png";

// Set the favicon dynamically to use the linux.png from attached_assets
try {
	const existingFavicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
	if (existingFavicon) {
		existingFavicon.href = linuxIcon;
		existingFavicon.type = "image/png";
	} else {
		const newFavicon = document.createElement("link");
		newFavicon.rel = "icon";
		newFavicon.type = "image/png";
		newFavicon.href = linuxIcon;
		document.head.appendChild(newFavicon);
	}
} catch (e) {
	// If anything fails (eg. during SSR or unusual runtime) just ignore
	// We don't want to break app startup due to favicon assignment
	console.warn("Could not set favicon dynamically:", e);
}

createRoot(document.getElementById("root")!).render(<App />);
