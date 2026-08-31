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
        .trim()
        .toLowerCase();
}

/**
 * Funzione helper per recuperare l'evento corretto dall'URL ?evento=...
 */
export function recuperaEventoDaUrl(listaEventi) {
    if (!listaEventi || listaEventi.length === 0) return null;

    const urlParams = new URLSearchParams(window.location.search);
    const rawIdUrl = urlParams.get('evento');

    if (!rawIdUrl) return null;

    const targetId = pulisciIdEvento(rawIdUrl);

    // Cerchiamo l'evento confrontando l'ID pulito
    return listaEventi.find(e => {
        const idBase = pulisciIdEvento(e);

        const nome = (e.nome_rilevato || e.nome || e.titolo || '').toLowerCase().trim();
        const citta = (e.citta || e.luogo || '').toLowerCase().trim();
        const idComposito = pulisciIdEvento(`${nome}_${citta}`);

        return idBase === targetId || idComposito === targetId || nome === targetId;
    }) || null;
}

export function gestisciPreferito(ev) {
    const idEvento = pulisciIdEvento(ev);
    if (!idEvento) return false;

    let preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti')) || [];
    let preferitiPuliti = preferiti.map(id => pulisciIdEvento(id));

    const index = preferitiPuliti.indexOf(idEvento);

    if (index > -1) {
        preferitiPuliti.splice(index, 1);
    } else {
        preferitiPuliti.push(idEvento);
    }

    localStorage.setItem('festeinvista_preferiti', JSON.stringify(preferitiPuliti));
    return preferitiPuliti.includes(idEvento);
}

export function isPreferito(ev) {
    const idEvento = pulisciIdEvento(ev);
    if (!idEvento) return false;

    const preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti')) || [];
    return preferiti.map(id => pulisciIdEvento(id)).includes(idEvento);
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
        const titolo = ev.nome_rilevato || ev.nome || ev.titolo || 'Evento su FesteInVista';
        const testo = `Scopri l'evento "${titolo}" su FesteInVista!`;

        const idOriginale = ev.id || ev.nome_rilevato || ev.nome || ev.titolo || '';
        const urlBase = `${window.location.origin}/dati-evento.html`;
        const urlCondivisione = `${urlBase}?evento=${encodeURIComponent(idOriginale)}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: titolo, text: testo, url: urlCondivisione });
            } catch (err) {
                console.log('Condivisione annullata:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(urlCondivisione);
                alert('Link dell\'evento copiato negli appunti!');
            } catch (err) {
                alert('Copia il link manualmente: ' + urlCondivisione);
            }
        }
    });

    return btn;
}

export function renderAzioniEvento(containerId, ev) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(creaPulsantePreferito(ev));
    container.appendChild(creaPulsanteCondividi(ev));
}

// ==========================================
// ESECUZIONE AUTOMATICA PER dati-evento.html
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Controlliamo se ci troviamo nella pagina dati-evento.html
    if (!window.location.pathname.includes('dati-evento.html')) return;

    try {
        const listaEventi = await fetchEventi();
        const evento = recuperaEventoDaUrl(listaEventi);

        const contenitoreMessaggio = document.querySelector('.card-messaggio') || document.getElementById('messaggio-errore');
        const contenitoreDettagli = document.getElementById('dettagli-evento-container') || document.getElementById('evento-dettaglio');

        if (evento) {
            // Nascondi il messaggio "Nessun evento selezionato"
            if (contenitoreMessaggio) contenitoreMessaggio.style.display = 'none';
            if (contenitoreDettagli) contenitoreDettagli.style.display = 'block';

            // Popola i campi principali se esistono nel DOM
            const elTitolo = document.getElementById('titolo-evento');
            if (elTitolo) elTitolo.textContent = evento.nome_rilevato || evento.nome;

            const elCitta = document.getElementById('citta-evento');
            if (elCitta) elCitta.textContent = evento.citta || evento.luogo || '';

            const elDesc = document.getElementById('descrizione-evento');
            if (elDesc) elDesc.textContent = evento.descrizione || '';

            // Renderizza i pulsanti Preferiti e Condividi
            renderAzioniEvento('azioni-evento-container', evento);
        } else {
            // Mostra la schermata "Nessun evento selezionato"
            if (contenitoreMessaggio) contenitoreMessaggio.style.display = 'block';
            if (contenitoreDettagli) contenitoreDettagli.style.display = 'none';
        }
    } catch (err) {
        console.error("Errore durante il caricamento dell'evento in dati-evento.html:", err);
    }
});