import '../styles/tailwind.css';
import { NetworkBackground } from './canvas/orchestrators/NetworkBackground.js';
import { HeaderNetwork } from './canvas/orchestrators/HeaderNetwork.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cyber-Glass Network Backgrounds
  const networkBackground = new NetworkBackground('network-canvas');
  networkBackground.init();

  const headerNetwork = new HeaderNetwork('header-canvas');
  headerNetwork.init();
});
