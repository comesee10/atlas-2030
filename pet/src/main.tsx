import { createRoot } from 'react-dom/client';
import Pet from './Pet';
import './index.css';

const host = document.getElementById('pet-root');
if (host) {
  createRoot(host).render(<Pet />);
}
