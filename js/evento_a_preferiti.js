// js/evento_a_preferiti.js
import { fetchEventi } from './data-fetcher.js';

// Funzione helper esportata per garantire che TUTTI i file usino lo stesso identico ID
export function pulisciIdEvento(ev) {
    if (!ev) return '';

    let rawId = typeof ev === 'string' ? ev : (ev.id || ev.nome_rilevato || ev.nome || ev.titolo || '');

    // Gestione stringa da URL: converte '+' in spazi e decodifica percentuali
    if (typeof rawId === 'string') {
        try {
            rawId = decodeURIComponent(rawId.replace(/\+/g, ' '));
        } catch (e) {
            // fallback se la stringa non è decodificabile
        }
    }

    return String(rawId)
        .replace(/["']/g, '')
        .trim();
}

/**
 * Funzione helper per recuperare l'evento corretto dall'URL ?evento=...
 */
export function recuperaEventoDaUrl(listaEventi) {
    if (!listaEventi || listaEventi.length === 0) return null;

    const urlParams = new URLSearchParams(window.location.search);
    const rawIdUrl = urlParams.get('evento');

    if (!rawIdUrl) return null;

    const targetIdClean = pulisciIdEvento(rawIdUrl).toLowerCase();

    // Cerchiamo l'evento confrontando l'ID pulito (in minuscolo per la ricerca flessibile da URL)
    return listaEventi.find(e => {
        const idBase = pulisciIdEvento(e).toLowerCase();

        const nome = (e.nome_rilevato || e.nome || e.titolo || '').toLowerCase().trim();
        const citta = (e.citta || e.luogo || '').toLowerCase().trim();
        const idComposito = `${nome}_${citta}`;

        return idBase === targetIdClean || idComposito === targetIdClean || nome === targetIdClean;
    }) || null;
}

export function gestisciPreferito(ev) {
    const idEvento = pulisciIdEvento(ev);
    if (!idEvento) return false;

    let preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti')) || [];

    const index = preferiti.indexOf(idEvento);

    if (index > -1) {
        preferiti.splice(index, 1);
    } else {
        preferiti.push(idEvento);
    }

    localStorage.setItem('festeinvista_preferiti', JSON.stringify(preferiti));
    return preferiti.includes(idEvento);
}

export function isPreferito(ev) {
    const idEvento = pulisciIdEvento(ev);
    if (!idEvento) return false;

    const preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti')) || [];
    return preferiti.includes(idEvento);
}

export function creaPulsantePreferito(ev) {
    const btn = document.createElement('button');
    btn.className = 'btn-interattivo btn-preferito';

    const aggiornaStato = (attivo) => {
        btn.classList.toggle('attivo', attivo);
        btn.innerHTML = attivo
            ? '<span>❤️</span> <span>Nei Preferiti</span>'
            : '<span>🤍</span> <span>Aggiungi ai Preferiti</span>';
    };

    aggiornaStato(isPreferito(ev));

    btn.addEventListener('click', () => {
        const statoNuovo = gestisciPreferito(ev);
        aggiornaStato(statoNuovo);
    });

    return btn;
}

export function creaPulsanteCondividi(ev) {
    const btn = document.createElement('button');
    btn.className = 'btn-interattivo btn-condividi';
    btn.innerHTML = '<span>🔗</span> <span>Condividi Evento</span>';

    btn.addEventListener('click', async () => {
        const titolo = ev.nome_rilevato || ev.nome || ev.titolo || 'Evento';
        const luogo = ev.citta || ev.luogo ? `📍 ${ev.citta || ev.luogo}\n` : '';

        const idOriginale = ev.id || ev.nome_rilevato || ev.nome || ev.titolo || '';
        const urlBase = `${window.location.origin}/dati-evento.html`;
        const urlCondivisione = `${urlBase}?evento=${encodeURIComponent(idOriginale)}`;

        // Rileva se l'utente è su un dispositivo mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // SU MOBILE (se c'è navigator.share)
        if (isMobile && navigator.share) {
            const messaggioCompleto = `🎉 *${titolo}*\n${luogo}Guarda i dettagli dell'evento su FesteInVista:\n${urlCondivisione}`;
            try {
                await navigator.share({
                    title: titolo,
                    text: messaggioCompleto
                });
            } catch (err) {
                console.log('Condivisione annullata:', err);
            }
        } else {
            // SU PC / DESKTOP (o browser senza share): Copia ESCLUSIVAMENTE il link negli appunti
            try {
                await navigator.clipboard.writeText(urlCondivisione);
                alert('Link dell\'evento copiato negli appunti!');
            } catch (err) {
                // Fallback nel caso in cui i permessi appunti siano bloccati
                window.prompt('Copia il link dell\'evento:', urlCondivisione);
            }
        }
    });

    return btn;
}

export function renderAzioniEvento(containerId, ev) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container || !ev) return;

    try {
        localStorage.setItem('eventoSelezionatoDettaglio', JSON.stringify(ev));
    } catch (e) {
        console.error("Errore salvataggio evento in localStorage:", e);
    }

    container.innerHTML = '';
    container.appendChild(creaPulsantePreferito(ev));
    container.appendChild(creaPulsanteCondividi(ev));
}