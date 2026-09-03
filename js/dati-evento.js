import { renderAzioniEvento, pulisciIdEvento } from './evento_a_preferiti.js';
import { fetchEventi } from './data-fetcher.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- Drawer Menu ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sideDrawer = document.getElementById('side-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            sideDrawer?.classList.add('open');
            drawerBackdrop?.classList.add('show');
        });
    }

    const chiudiDrawer = () => {
        sideDrawer?.classList.remove('open');
        drawerBackdrop?.classList.remove('show');
    };

    drawerCloseBtn?.addEventListener('click', chiudiDrawer);
    drawerBackdrop?.addEventListener('click', chiudiDrawer);

    // --- Formattazione Date ---
    const pulisciDataIso = (dataStr) => dataStr ? dataStr.split('T')[0] : '';
    const formattaInItaliano = (dataIso) => {
        const soloData = pulisciDataIso(dataIso);
        if (!soloData) return '';
        const [anno, mese, giorno] = soloData.split('-');
        if (!anno || !mese || !giorno) return soloData;
        return new Date(anno, mese - 1, giorno).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // --- Recupero Evento (Istantaneo da LocalStorage, Fetch solo se necessario) ---
    let ev = null;

    // 1. PRIMA leggi da LocalStorage per un'apertura istantanea (0 ms)
    const eventoJson = localStorage.getItem('eventoSelezionatoDettaglio');
    if (eventoJson) {
        try {
            ev = JSON.parse(eventoJson);
        } catch (e) {
            console.error("Errore parsing LocalStorage:", e);
        }
    }

    // 2. Controlla se c'è un ID nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const rawIdUrl = urlParams.get('evento');

    if (rawIdUrl) {
        const targetId = pulisciIdEvento(rawIdUrl);
        const idInLocalStorage = ev ? pulisciIdEvento(ev) : '';

        // Esegui la fetch SOLO SE l'evento non è in LocalStorage o se l'ID nell'URL è diverso
        if (!ev || idInLocalStorage !== targetId) {
            try {
                const listaEventi = await fetchEventi();
                const eventoTrovato = listaEventi.find(item => {
                    const idBase = pulisciIdEvento(item);
                    const nome = (item.nome_rilevato || item.nome || item.titolo || '').toLowerCase().trim();
                    const citta = (item.citta || item.luogo || '').toLowerCase().trim();
                    const idComposito = pulisciIdEvento(`${nome}_${citta}`);

                    return idBase === targetId || idComposito === targetId || nome === targetId;
                });

                if (eventoTrovato) {
                    ev = eventoTrovato;
                }
            } catch (err) {
                console.error("Errore durante il recupero dell'evento da URL:", err);
            }
        }
    }

    // --- Popolamento Interfaccia ---
    if (ev) {
        document.getElementById('det-titolo').textContent = ev.nome_rilevato || ev.nome || 'Evento senza nome';
        document.getElementById('det-locandina').src = ev.locandina || './images/cosplayersitaliani.webp';

        const dataInizioFormatted = formattaInItaliano(ev.data_inizio_grezza || ev.data_inizio || ev.data);
        const dataFineFormatted = formattaInItaliano(ev.data_fine_grezza || ev.data_fine);

        let stringaDate = dataInizioFormatted;
        if (dataFineFormatted && dataInizioFormatted !== dataFineFormatted) {
            stringaDate = `Dal ${dataInizioFormatted} al ${dataFineFormatted}`;
        }
        document.getElementById('det-date').textContent = stringaDate || 'Data non specificata';

        const luogoEl = document.getElementById('det-luogo');
        const testoLuogo = ev.luogo || 'Luogo non specificato';

        // NUOVO CODICE (Apri itinerario su Google Maps)
        if (ev.latitudine && ev.longitudine && ev.latitudine !== 0 && ev.longitudine !== 0) {
            const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${ev.latitudine},${ev.longitudine}`;
            luogoEl.innerHTML = `<a href="${urlGoogleMaps}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;" title="Calcola itinerario su Google Maps">${testoLuogo} 📍</a>`;
        } else if (testoLuogo && testoLuogo !== 'Luogo non specificato') {
            // Fallback: se non ci sono coordinate lat/lng ma c'è un testo del luogo, cerca il luogo per nome su Google Maps
            const urlRicercaMaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(testoLuogo)}`;
            luogoEl.innerHTML = `<a href="${urlRicercaMaps}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;" title="Calcola itinerario su Google Maps">${testoLuogo} 📍</a>`;
        } else {
            luogoEl.textContent = testoLuogo;
        }

        document.getElementById('det-categoria').textContent = ev.categoria || ev.tipo || 'Generale';

        const telefonoVal = ev.telefoni || ev.telefono;
        if (telefonoVal) {
            document.getElementById('det-telefono-container').innerHTML = `<a href="tel:${telefonoVal}">${telefonoVal}</a>`;
            document.getElementById('box-telefono').style.display = 'block';
        }

        if (ev.email) {
            const emailEl = document.getElementById('det-email');
            emailEl.textContent = ev.email;
            emailEl.href = `mailto:${ev.email}`;
            document.getElementById('box-email').style.display = 'block';
        }

        if (ev.sito_web || ev.sito) {
            const sitoEl = document.getElementById('det-sito');
            sitoEl.href = ev.sito_web || ev.sito;
            sitoEl.style.display = 'inline-block';
        }

        if (ev.link_biglietti || ev.biglietti) {
            const biglEl = document.getElementById('det-biglietti');
            biglEl.href = ev.link_biglietti || ev.biglietti;
            biglEl.style.display = 'inline-block';
        }

        if (ev.descrizione) {
            document.getElementById('det-descrizione').innerHTML = ev.descrizione;
        }

        // INTEGRATORE AZIONI (Preferiti & Condividi)
        renderAzioniEvento('azioni-bar-container', ev);

    } else {
        document.getElementById('dettaglio-container').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>Nessun evento selezionato</h2>
                <p>Torna alla <a href="index.html">Home</a> o alla <a href="elenco.html">Mappa</a> e seleziona un evento per visualizzarne i dettagli.</p>
            </div>
        `;
    }
});