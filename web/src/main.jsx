import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// No StrictMode: drei's <Html> labels mount their own React roots and StrictMode's double mount
// makes every label log "synchronously unmount a root" in development.
createRoot(document.getElementById('root')).render(<App />);
