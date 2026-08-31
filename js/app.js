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

window.forzaAggiornamentoDati = async function forzaAggiornamentoDati() {
    const btn = document.getElementById('btn-aggiorna-dati');
    try {
        btn.classList.add('ruota');
        btn.disabled = true;

        console.log("🔄 Controllo aggiornamenti grafici e dati in corso...");

        // 1. Svuota tutte le cache salvate dal browser per questa app
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                await caches.delete(name);
                console.log(`🗑️ Eliminata cache obsoleta: ${name}`);
            }
        }

        // 2. Rimuovi i Service Worker registrati per evitare che ricarichino file vecchi
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
                console.log("🔌 Service Worker disinstallato per forzare l'aggiornamento.");
            }
        }

        // 3. Breve pausa visiva per l'animazione, poi ricarica la pagina da zero
        setTimeout(() => {
            window.location.reload(true);
        }, 800);

    } catch (error) {
        console.error("❌ Errore durante l'aggiornamento grafico:", error);
        alert("Impossibile aggiornare la grafica. Controlla la connessione.");
        btn.classList.remove('ruota');
        btn.disabled = false;
    }
}