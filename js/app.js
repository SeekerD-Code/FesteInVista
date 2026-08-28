// app.js - Funzioni globali e gestione comune a tutto il sito

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log("Nuova versione disponibile, aggiorno l'app...");
                    window.location.reload();
                }
            });
        });
    }).catch(err => console.log("Service Worker non registrato:", err));
}

    // Gestione globale del menu laterale (Drawer) per tutte le pagine
    document.addEventListener('click', (event) => {
        const menuBtn = event.target.closest('#menu-toggle-btn');
        if (menuBtn) {
            event.preventDefault();
            event.stopPropagation();

            const drawer = document.getElementById('side-drawer');
            const backdrop = document.getElementById('drawer-backdrop');

            if (drawer) {
                drawer.classList.toggle('open');
                drawer.style.transform = drawer.classList.contains('open') ? 'translateX(0)' : 'translateX(-100%)';
            }
            if (backdrop) {
                backdrop.classList.toggle('active');
                backdrop.style.opacity = backdrop.classList.contains('active') ? '1' : '0';
                backdrop.style.visibility = backdrop.classList.contains('active') ? 'visible' : 'hidden';
            }
            return;
        }

        // Chiusura menu laterale (tramite la 'X' o cliccando sullo sfondo scuro)
        if (event.target.closest('#drawer-close-btn') || event.target.id === 'drawer-backdrop') {
            const drawer = document.getElementById('side-drawer');
            const backdrop = document.getElementById('drawer-backdrop');

            if (drawer) {
                drawer.classList.remove('open');
                drawer.style.transform = 'translateX(-100%)';
            }
            if (backdrop) {
                backdrop.classList.remove('active');
                backdrop.style.opacity = '0';
                backdrop.style.visibility = 'hidden';
            }
            return;
        }
    });
});

export function apriModaleDettagli(ev) {
    localStorage.setItem('eventoSelezionatoDettaglio', JSON.stringify(ev));

    // Controlla se la pagina corrente è dentro la cartella 'eventi'
    const isInEventi = window.location.pathname.includes('/eventi/');
    const targetUrl = isInEventi ? '../dati-evento.html' : 'dati-evento.html';

    window.location.href = targetUrl;
}

// --- Gestione Unificata Installazione PWA (Desktop & Mobile) ---
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Impedisce al browser di mostrare il banner automatico
    e.preventDefault();
    deferredPrompt = e;

    // Mostra il pulsante PC se siamo su desktop
    const pcBtn = document.getElementById('pwa-install-pc-btn');
    if (pcBtn) {
        pcBtn.style.display = 'flex';
    }

    // Mostra il quadratino mobile se siamo su smartphone
    const mobileFloatBtn = document.getElementById('pwa-install-mobile-float');
    if (mobileFloatBtn) {
        mobileFloatBtn.style.display = 'flex';
    }
});

// Funzione comune per attivare il prompt
async function triggerPwaInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('Utente ha installato la PWA');
    }

    deferredPrompt = null;
    hideAllInstallButtons();
}

function hideAllInstallButtons() {
    const pcBtn = document.getElementById('pwa-install-pc-btn');
    if (pcBtn) pcBtn.style.display = 'none';

    const mobileFloatBtn = document.getElementById('pwa-install-mobile-float');
    if (mobileFloatBtn) mobileFloatBtn.style.display = 'none';
}

// Associa i click ai rispettivi pulsanti
document.addEventListener('click', (e) => {
    if (e.target.closest('#pwa-install-pc-btn') || e.target.closest('#pwa-install-mobile-float')) {
        triggerPwaInstall();
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installata correttamente!');
    hideAllInstallButtons();
    deferredPrompt = null;
});

async function forzaAggiornamentoDati() {
    const btn = document.getElementById('btn-aggiorna-dati');
    try {
        btn.classList.add('ruota'); // Opzionale: classe CSS per animare l'icona
        btn.disabled = true;

        console.log("🔄 Aggiornamento manuale in corso...");

        // 1. Pulisci la cache del browser (se usi Cache API) o svuota i dati temporanei degli eventi
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                if (name.includes('dynamic-data') || name.includes('festeinvista-cache')) {
                    await caches.delete(name);
                }
            }
        }

        // 2. Scarica i dati freschi dal server/foglio
        const risposta = await fetch('/tuo-endpoint-o-dati.json', { cache: 'no-store' });
        const nuoviDati = await risposta.json();

        // 3. Aggiorna lo stato o la variabile globale degli eventi dell'app
        // NOTA: localStorage.getItem('tuoi_preferiti') NON viene toccato qui!
        eventiGlobali = nuoviDati;

        // 4. Ridisegna la mappa e/o la lista degli eventi
        aggiornaMappa(eventiGlobali);
        aggiornaLista(eventiGlobali);

        console.log("✅ Dati aggiornati con successo!");
        alert("Eventi aggiornati all'ultima versione!");

    } catch (error) {
        console.error("❌ Errore durante l'aggiornamento:", error);
        alert("Impossibile aggiornare. Controlla la connessione.");
    } finally {
        btn.classList.remove('ruota');
        btn.disabled = false;
    }
}