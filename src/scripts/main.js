import '../styles/tailwind.css';
import { NetworkBackground } from './canvas/orchestrators/NetworkBackground.js';
import { HeaderNetwork } from './canvas/orchestrators/HeaderNetwork.js';
import { certificates } from './data/certificates.js';
import { filterConfig } from './config/filterConfig.js';
import { GalleryRenderer } from './ui/GalleryRenderer.js';
import { FilterBar } from './ui/filter-bar/FilterBar.js';
import { ModalController } from './controllers/ModalController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cyber-Glass Network Backgrounds
  const networkBackground = new NetworkBackground('network-canvas');
  networkBackground.init();

  const headerNetwork = new HeaderNetwork('header-canvas');
  headerNetwork.init();

  // Render the credential cards, filter bar and detail modal
  const galleryRoot = document.getElementById('credentials-container');
  const barMount = document.getElementById('filter-bar');
  if (galleryRoot && barMount) {
    const renderer = new GalleryRenderer(galleryRoot, () => filterBar.clear());
    const filterBar = new FilterBar({
      mount: barMount,
      records: certificates,
      config: filterConfig,
      onChange: renderer.render,
    });
    filterBar.init();

    const modalController = new ModalController(galleryRoot);
    modalController.init();
  }
});
