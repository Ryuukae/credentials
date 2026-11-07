import '../styles/tailwind.css';
import { NetworkBackground } from './canvas/orchestrators/NetworkBackground.js';
import { HeaderNetwork } from './canvas/orchestrators/HeaderNetwork.js';
import { certificates } from './data/certificates.js';
import { CertificateCardFactory } from './ui/CertificateCardFactory.js';
import { ModalController } from './controllers/ModalController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cyber-Glass Network Backgrounds
  const networkBackground = new NetworkBackground('network-canvas');
  networkBackground.init();

  const headerNetwork = new HeaderNetwork('header-canvas');
  headerNetwork.init();

  // Render the credential cards and wire up the detail modal
  const listContainer = document.getElementById('credentials-container');
  if (listContainer) {
    certificates.forEach((cert, index) => {
      const card = CertificateCardFactory.createCard(cert);
      // Stagger the fade-in; capped so the whole grid settles in about a second.
      card.style.setProperty('--i', Math.min(index, 15));
      listContainer.appendChild(card);
    });

    const modalController = new ModalController(listContainer);
    modalController.init();
  }
});
