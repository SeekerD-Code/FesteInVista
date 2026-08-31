<<<<<<< HEAD
import { fetchEventi } from './data-fetcher.js';
import { creaCardEvento, popolaMesiSelect, initCustomCalendar } from './ui-components.js';
import { apriModaleDettagli } from './app.js';
import { normalizzaDataPerFiltri } from './filters-utils.js';

let currentCalendarDate = new Date();
let selectedStartDate = null;
let selectedEndDate = null;
let eventiTotali = [];
let eventoDaUrlGiaControllato = false; // Evita di riaprire la modale 2 volte se i dati aggiornano in background

// Funzione di utilità per ricavare una stringa ID pulita e univoca da un oggetto evento
function ottieniIdConfronto(e) {
    if (!e) return '';
    // Se esiste un ID univoco esplicito usiamo quello
    if (e.id) return String(e.id).replace(/["']/g, '').trim().toLowerCase();

    // Altrimenti creiamo una chiave combinata Nome + Città per evitare falsi positivi
    const nome = (e.nome_rilevato || e.nome || e.titolo || '').replace(/["']/g, '').trim().toLowerCase();
    const citta = (e.citta || e.luogo || '').replace(/["']/g, '').trim().toLowerCase();
    return citta ? `${nome}_${citta}` : nome;
}

// Funzione per verificare ed aprire l'evento dall'URL ?evento=
function controllaEventoDaUrl(listaEventi) {
    if (eventoDaUrlGiaControllato) return;

    const urlParams = new URLSearchParams(window.location.search);
    const rawIdUrl = urlParams.get('evento');

    if (!rawIdUrl || !listaEventi || listaEventi.length === 0) return;

    // Decodifica l'ID gestendo eventuali errori di sintassi
    let idDecodificato = rawIdUrl;
    try {
        idDecodificato = decodeURIComponent(rawIdUrl);
    } catch (e) {
        console.warn("Impossibile decodificare l'URL dell'evento:", e);
    }

    const targetId = String(idDecodificato).replace(/["']/g, '').trim().toLowerCase();

    // Cerca l'evento corrispondente nella lista
    const eventoTrovato = listaEventi.find(e => {
        const evId = ottieniIdConfronto(e);
        // Verifica sia se coincide l'ID composito sia se coincide solo l'ID o nome base
        const soloNomeId = String(e.id || e.nome_rilevato || e.nome || '').replace(/["']/g, '').trim().toLowerCase();
        return evId === targetId || soloNomeId === targetId;
    });

    if (eventoTrovato) {
        apriModaleDettagli(eventoTrovato);
        eventoDaUrlGiaControllato = true; // Segna che è stato gestito con successo
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    function processaValori(rawEventi) {
        const eventiNormalizzati = rawEventi ? rawEventi.map(e => {
            const dataInizioNorm = normalizzaDataPerFiltri(e.data_inizio_grezza);
            const dataFineNorm = normalizzaDataPerFiltri(e.data_fine_grezza || e.data_inizio_grezza);

            return {
                ...e,
                data_inizio_grezza: dataInizioNorm,
                data_fine_grezza: dataFineNorm,
                data_inizio_standard: dataInizioNorm,
                data_fine_standard: dataFineNorm
            };
        }) : [];

        return raggruppaEventiVicini(eventiNormalizzati);
    }

    function raggruppaEventiVicini(eventi) {
        const mappa = new Map();

        eventi.forEach(ev => {
            const nomeKey = (ev.nome_rilevato || ev.nome || '').toLowerCase().trim();
            const luogoKey = (ev.citta || ev.luogo || '').toLowerCase().trim();
            const chiaveUnica = `${nomeKey}_${luogoKey}`;

            const inizioNorm = ev.data_inizio_grezza;
            const fineNorm = ev.data_fine_grezza || inizioNorm;

            if (!mappa.has(chiaveUnica)) {
                mappa.set(chiaveUnica, {
                    ...ev,
                    intervalliDate: [{ inizio: inizioNorm, fine: fineNorm }]
                });
            } else {
                const esistente = mappa.get(chiaveUnica);
                const esisteGia = esistente.intervalliDate.some(item => item.inizio === inizioNorm && item.fine === fineNorm);
                if (!esisteGia) {
                    esistente.intervalliDate.push({ inizio: inizioNorm, fine: fineNorm });
                }
            }
        });

        return Array.from(mappa.values()).map(ev => {
            ev.intervalliDate.sort((a, b) => new Date(a.inizio) - new Date(b.inizio));
            ev.data_inizio_grezza = ev.intervalliDate[0].inizio;
            ev.data_fine_grezza = ev.intervalliDate[ev.intervalliDate.length - 1].fine;
            return ev;
        });
    }

    // Aggiornamento dati in background
    window.aggiornaDatiInBackground = (rawEventiFreschi) => {
        eventiTotali = processaValori(rawEventiFreschi);
        popolaMesiInSelect(eventiTotali);
        eseguiFiltroERender();
        controllaEventoDaUrl(eventiTotali);
    };

    // Caricamento iniziale dei dati
    const rawEventi = await fetchEventi();
    eventiTotali = processaValori(rawEventi);

    // Controllo e apertura automatica dell'evento da URL
    controllaEventoDaUrl(eventiTotali);

    function popolaMesiInSelect(listaEventi) {
        const selectMese = document.getElementById('filter-mese');
        if (!selectMese) return;

        if (typeof popolaMesiSelect === 'function') {
            popolaMesiSelect(listaEventi);
        } else {
            const mesiDisponibili = [...new Set(listaEventi.map(e => e.data_inizio_grezza ? e.data_inizio_grezza.substring(0, 7) : null))].filter(Boolean).sort();
            let optionsHtml = '<option value="">Tutti i mesi</option>';
            mesiDisponibili.forEach(meseStr => {
                const [anno, mese] = meseStr.split('-');
                const dataFormattata = new Date(anno, mese - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                const meseLabel = dataFormattata.charAt(0).toUpperCase() + dataFormattata.slice(1);
                optionsHtml += `<option value="${meseStr}">${meseLabel}</option>`;
            });
            selectMese.innerHTML = optionsHtml;
        }
    }

    const selectMese = document.getElementById('filter-mese');
    if (selectMese) {
        popolaMesiInSelect(eventiTotali);
        selectMese.addEventListener('change', () => eseguiFiltroERender());
    }

    initCustomCalendar();

    function filtraEventiElenco(eventi) {
        const searchInput = document.getElementById('search-input');
        const testoQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const meseFiltro = document.getElementById('filter-mese')?.value || '';
        const daFiltro = document.getElementById('filter-da')?.value || '';
        const aFiltro = document.getElementById('filter-a')?.value || '';

        const cittaFiltro = document.getElementById('filter-citta')?.value.toLowerCase().trim() || '';
        const provFiltro = document.getElementById('filter-provincia')?.value.toLowerCase().trim() || '';
        const regFiltro = document.getElementById('filter-regione')?.value.toLowerCase().trim() || '';

        const categoryCheckboxes = document.querySelectorAll('input[name="categoria"]');
        const categorieSelezionate = Array.from(categoryCheckboxes)
            .filter(c => c.checked)
            .map(c => c.value.toLowerCase());

        return eventi.filter(evento => {
            const nomeEv = (evento.nome_rilevato || evento.nome || '').toLowerCase().trim();
            const catEv = (evento.categoria || evento.tipo || evento.genere || '').toLowerCase().trim();
            const cittaEv = (evento.citta || '').toLowerCase().trim();
            const provEv = (evento.provincia || '').toLowerCase().trim();
            const regEv = (evento.regione || '').toLowerCase().trim();

            const inizioStd = evento.data_inizio_grezza;
            const fineStd = evento.data_fine_grezza || inizioStd;

            if (testoQuery) {
                const matchNome = nomeEv.includes(testoQuery);
                const matchCitta = cittaEv.includes(testoQuery);
                const matchProv = provEv.includes(testoQuery);
                if (!matchNome && !matchCitta && !matchProv) return false;
            }

            if (categoryCheckboxes.length > 0 && categorieSelezionate.length < categoryCheckboxes.length) {
                const matchCat = categorieSelezionate.some(cat => catEv.includes(cat));
                if (!matchCat) return false;
            }

            let matchMese = true;
            if (meseFiltro) {
                const [annoF, meseF] = meseFiltro.split('-').map(Number);
                if (meseF === 10 || meseF === 11) {
                    matchMese = evento.intervalliDate.some(intervallo => {
                        const [iAnno, iMese] = intervallo.inizio.split('-').map(Number);
                        const [fAnno, fMese] = intervallo.fine.split('-').map(Number);
                        const inizioMeseTotale = iAnno * 12 + iMese;
                        const fineMeseTotale = fAnno * 12 + fMese;
                        const filtroMeseTotale = annoF * 12 + meseF;
                        return fineMeseTotale >= filtroMeseTotale && inizioMeseTotale <= filtroMeseTotale + 4;
                    });
                } else {
                    matchMese = evento.intervalliDate.some(intervallo =>
                        intervallo.inizio.startsWith(meseFiltro) || intervallo.fine.startsWith(meseFiltro)
                    );
                }
                if (!matchMese) return false;
            }

            if (daFiltro && fineStd < daFiltro) return false;
            if (aFiltro && inizioStd > aFiltro) return false;

            if (cittaFiltro && !cittaEv.includes(cittaFiltro)) return false;
            if (provFiltro && !provEv.includes(provFiltro)) return false;
            if (regFiltro && !regEv.includes(regFiltro)) return false;

            return true;
        });
    }

    function renderizzaEventi(listaEventi) {
        const containerPrimi = document.getElementById('primi-eventi-container');
        const containerEventi = document.getElementById('anteprima-eventi');
        const sezionePreferitiTitolo = document.getElementById('titolo-sezione-preferiti');
        const sortSelect = document.getElementById('sort-order-select');
        const counterSpan = document.getElementById('counter-value');
        const oggi = new Date().toISOString().split('T')[0];

        const ordinamentoScelto = sortSelect ? sortSelect.value : 'asc';
        const ordinati = [...listaEventi].sort((a, b) => {
            const dataA = new Date(a.data_inizio_grezza);
            const dataB = new Date(b.data_inizio_grezza);
            return ordinamentoScelto === 'asc' ? dataA - dataB : dataB - dataA;
        });

        const validi = ordinati.filter(e => e.data_fine_grezza >= oggi);

        if (counterSpan) {
            counterSpan.textContent = validi.length;
        }

        const preferitiIds = JSON.parse(localStorage.getItem('festeinvista_preferiti') || '[]');
        const preferitiPuliti = preferitiIds.map(id => String(id).replace(/["']/g, '').trim().toLowerCase());

        const eventiPreferiti = validi.filter(e => {
            const evId = String(e.id || e.nome_rilevato || e.nome || '').replace(/["']/g, '').trim().toLowerCase();
            return preferitiPuliti.includes(evId);
        });

        if (containerPrimi) {
            if (eventiPreferiti.length > 0) {
                if (sezionePreferitiTitolo) sezionePreferitiTitolo.style.display = 'block';
                containerPrimi.style.display = 'grid';
                containerPrimi.innerHTML = eventiPreferiti.map(e => creaCardEvento(e, false)).join('');
            } else {
                if (sezionePreferitiTitolo) sezionePreferitiTitolo.style.display = 'none';
                containerPrimi.style.display = 'none';
                containerPrimi.innerHTML = '';
            }
        }

        if (containerEventi) {
            containerEventi.innerHTML = validi.length > 0
                ? validi.map(e => creaCardEvento(e, false)).join('')
                : '<p style="padding: 20px; text-align: center; color: #666;">Nessun evento disponibile con i filtri selezionati.</p>';
        }
    }

    function eseguiFiltroERender() {
        const filtrati = filtraEventiElenco(eventiTotali);
        renderizzaEventi(filtrati);
    }

    document.addEventListener('date-selection-changed', () => {
        eseguiFiltroERender();
    });

    if (eventiTotali && eventiTotali.length > 0) {
        renderizzaEventi(eventiTotali);
    }
    window.festeinvistaDatiPronti = true;
    window.dispatchEvent(new Event('festeinvista-pronta'));

    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-order-select');
    const categoryCheckboxes = document.querySelectorAll('input[name="categoria"]');

    if (searchInput) searchInput.addEventListener('input', () => eseguiFiltroERender());
    if (sortSelect) sortSelect.addEventListener('change', () => eseguiFiltroERender());

    categoryCheckboxes.forEach(chk => {
        chk.addEventListener('change', () => eseguiFiltroERender());
    });

    const idsFiltriDinamici = ['filter-citta', 'filter-provincia', 'filter-regione', 'filter-da', 'filter-a'];
    idsFiltriDinamici.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventoAscolto = el.type === 'date' ? 'change' : 'input';
            el.addEventListener(eventoAscolto, () => eseguiFiltroERender());
        }
    });

    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            const selectMese = document.getElementById('filter-mese');
            if (selectMese) selectMese.value = '';
            document.getElementById('filter-citta').value = '';
            document.getElementById('filter-provincia').value = '';
            document.getElementById('filter-regione').value = '';
            document.getElementById('filter-da').value = '';
            document.getElementById('filter-a').value = '';

            selectedStartDate = null;
            selectedEndDate = null;
            const summaryEl = document.getElementById('date-summary-text');
            if (summaryEl) summaryEl.textContent = '📅 Date';

            categoryCheckboxes.forEach(chk => chk.checked = true);
            initCustomCalendar();
            renderizzaEventi(eventiTotali);
        });
    }

    document.addEventListener('click', (e) => {
        const btnPreferito = e.target.closest('.btn-preferito-overlay');
        if (btnPreferito) {
            const idEvento = btnPreferito.getAttribute('data-id');
            if (idEvento) {
                let preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti') || '[]');
                if (preferiti.includes(idEvento)) {
                    preferiti = preferiti.filter(id => id !== idEvento);
                    btnPreferito.classList.remove('preferito-attivo');
                } else {
                    preferiti.push(idEvento);
                    btnPreferito.classList.add('preferito-attivo');
                }
                localStorage.setItem('festeinvista_preferiti', JSON.stringify(preferiti));
                eseguiFiltroERender();
            }
            return;
        }

        const btnDettaglio = e.target.closest('.btn-apri-dettaglio');
        if (btnDettaglio) {
            const eventoB64 = btnDettaglio.getAttribute('data-evento-b64');
            try {
                const eventoJson = decodeURIComponent(atob(eventoB64));
                const evento = JSON.parse(eventoJson);
                apriModaleDettagli(evento);
            } catch (err) {
                console.error("Errore nel parsing dei dati dell'evento:", err);
            }
        }
    });
=======
import { fetchEventi } from './data-fetcher.js';
import { creaCardEvento, popolaMesiSelect, initCustomCalendar } from './ui-components.js';
import { apriModaleDettagli } from './app.js';
import { normalizzaDataPerFiltri } from './filters-utils.js';

let currentCalendarDate = new Date();
let selectedStartDate = null;
let selectedEndDate = null;
let eventiTotali = [];

document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    function processaValori(rawEventi) {
        const eventiNormalizzati = rawEventi ? rawEventi.map(e => {
            const dataInizioNorm = normalizzaDataPerFiltri(e.data_inizio_grezza);
            const dataFineNorm = normalizzaDataPerFiltri(e.data_fine_grezza || e.data_inizio_grezza);

            return {
                ...e,
                data_inizio_grezza: dataInizioNorm,
                data_fine_grezza: dataFineNorm,
                // Aggiungiamo le proprietà standard per compatibilità totale con filters-utils.js
                data_inizio_standard: dataInizioNorm,
                data_fine_standard: dataFineNorm
            };
        }) : [];

        return raggruppaEventiVicini(eventiNormalizzati);
    }

    function raggruppaEventiVicini(eventi) {
        const mappa = new Map();

        eventi.forEach(ev => {
            const nomeKey = (ev.nome_rilevato || ev.nome || '').toLowerCase().trim();
            const luogoKey = (ev.citta || ev.luogo || '').toLowerCase().trim();
            const chiaveUnica = `${nomeKey}_${luogoKey}`;

            const inizioNorm = ev.data_inizio_grezza;
            const fineNorm = ev.data_fine_grezza || inizioNorm;

            if (!mappa.has(chiaveUnica)) {
                mappa.set(chiaveUnica, {
                    ...ev,
                    intervalliDate: [{ inizio: inizioNorm, fine: fineNorm }]
                });
            } else {
                const esistente = mappa.get(chiaveUnica);
                const esisteGia = esistente.intervalliDate.some(item => item.inizio === inizioNorm && item.fine === fineNorm);
                if (!esisteGia) {
                    esistente.intervalliDate.push({ inizio: inizioNorm, fine: fineNorm });
                }
            }
        });

        return Array.from(mappa.values()).map(ev => {
            ev.intervalliDate.sort((a, b) => new Date(a.inizio) - new Date(b.inizio));
            ev.data_inizio_grezza = ev.intervalliDate[0].inizio;
            ev.data_fine_grezza = ev.intervalliDate[ev.intervalliDate.length - 1].fine;
            return ev;
        });
    }

    // Funzione per aggiornare la UI se arrivano dati nuovi freschi dalla rete in background
    window.aggiornaDatiInBackground = (rawEventiFreschi) => {
        eventiTotali = processaValori(rawEventiFreschi);
        popolaMesiInSelect(eventiTotali);
        eseguiFiltroERender();
    };

    // Caricamento immediato (sfrutta la cache in 0 secondi)
    const rawEventi = await fetchEventi();
    eventiTotali = processaValori(rawEventi);

    function popolaMesiInSelect(listaEventi) {
        const selectMese = document.getElementById('filter-mese');
        if (!selectMese) return;

        if (typeof popolaMesiSelect === 'function') {
            popolaMesiSelect(listaEventi);
        } else {
            const mesiDisponibili = [...new Set(listaEventi.map(e => e.data_inizio_grezza ? e.data_inizio_grezza.substring(0, 7) : null))].filter(Boolean).sort();
            let optionsHtml = '<option value="">Tutti i mesi</option>';
            mesiDisponibili.forEach(meseStr => {
                const [anno, mese] = meseStr.split('-');
                const dataFormattata = new Date(anno, mese - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                const meseLabel = dataFormattata.charAt(0).toUpperCase() + dataFormattata.slice(1);
                optionsHtml += `<option value="${meseStr}">${meseLabel}</option>`;
            });
            selectMese.innerHTML = optionsHtml;
        }
    }

    const selectMese = document.getElementById('filter-mese');
    if (selectMese) {
        popolaMesiInSelect(eventiTotali);
        selectMese.addEventListener('change', () => eseguiFiltroERender());
    }

    initCustomCalendar();

    function filtraEventiElenco(eventi) {
        const searchInput = document.getElementById('search-input');
        const testoQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const meseFiltro = document.getElementById('filter-mese')?.value || '';
        const daFiltro = document.getElementById('filter-da')?.value || '';
        const aFiltro = document.getElementById('filter-a')?.value || '';

        const cittaFiltro = document.getElementById('filter-citta')?.value.toLowerCase().trim() || '';
        const provFiltro = document.getElementById('filter-provincia')?.value.toLowerCase().trim() || '';
        const regFiltro = document.getElementById('filter-regione')?.value.toLowerCase().trim() || '';

        const categoryCheckboxes = document.querySelectorAll('input[name="categoria"]');
        const categorieSelezionate = Array.from(categoryCheckboxes)
            .filter(c => c.checked)
            .map(c => c.value.toLowerCase());

        return eventi.filter(evento => {
            const nomeEv = (evento.nome_rilevato || evento.nome || '').toLowerCase().trim();
            const catEv = (evento.categoria || evento.tipo || evento.genere || '').toLowerCase().trim();
            const cittaEv = (evento.citta || '').toLowerCase().trim();
            const provEv = (evento.provincia || '').toLowerCase().trim();
            const regEv = (evento.regione || '').toLowerCase().trim();

            const inizioStd = evento.data_inizio_grezza;
            const fineStd = evento.data_fine_grezza || inizioStd;

            if (testoQuery) {
                const matchNome = nomeEv.includes(testoQuery);
                const matchCitta = cittaEv.includes(testoQuery);
                const matchProv = provEv.includes(testoQuery);
                if (!matchNome && !matchCitta && !matchProv) return false;
            }

            if (categoryCheckboxes.length > 0 && categorieSelezionate.length < categoryCheckboxes.length) {
                const matchCat = categorieSelezionate.some(cat => catEv.includes(cat));
                if (!matchCat) return false;
            }

            let matchMese = true;
            if (meseFiltro) {
                const [annoF, meseF] = meseFiltro.split('-').map(Number);
                if (meseF === 10 || meseF === 11) {
                    matchMese = evento.intervalliDate.some(intervallo => {
                        const [iAnno, iMese] = intervallo.inizio.split('-').map(Number);
                        const [fAnno, fMese] = intervallo.fine.split('-').map(Number);
                        const inizioMeseTotale = iAnno * 12 + iMese;
                        const fineMeseTotale = fAnno * 12 + fMese;
                        const filtroMeseTotale = annoF * 12 + meseF;
                        return fineMeseTotale >= filtroMeseTotale && inizioMeseTotale <= filtroMeseTotale + 4;
                    });
                } else {
                    matchMese = evento.intervalliDate.some(intervallo =>
                        intervallo.inizio.startsWith(meseFiltro) || intervallo.fine.startsWith(meseFiltro)
                    );
                }
                if (!matchMese) return false;
            }

            if (daFiltro && fineStd < daFiltro) return false;
            if (aFiltro && inizioStd > aFiltro) return false;

            if (cittaFiltro && !cittaEv.includes(cittaFiltro)) return false;
            if (provFiltro && !provEv.includes(provFiltro)) return false;
            if (regFiltro && !regEv.includes(regFiltro)) return false;

            return true;
        });
    }

    function renderizzaEventi(listaEventi) {
        const containerPrimi = document.getElementById('primi-eventi-container');
        const containerEventi = document.getElementById('anteprima-eventi');
        const sezionePreferitiTitolo = document.getElementById('titolo-sezione-preferiti');
        const sortSelect = document.getElementById('sort-order-select');
        const counterSpan = document.getElementById('counter-value');
        const oggi = new Date().toISOString().split('T')[0];

        const ordinamentoScelto = sortSelect ? sortSelect.value : 'asc';
        const ordinati = [...listaEventi].sort((a, b) => {
            const dataA = new Date(a.data_inizio_grezza);
            const dataB = new Date(b.data_inizio_grezza);
            return ordinamentoScelto === 'asc' ? dataA - dataB : dataB - dataA;
        });

        const validi = ordinati.filter(e => e.data_fine_grezza >= oggi);

        if (counterSpan) {
            counterSpan.textContent = validi.length;
        }

        const preferitiIds = JSON.parse(localStorage.getItem('festeinvista_preferiti') || '[]');
        const eventiPreferiti = validi.filter(e => preferitiIds.includes(e.id || e.nome_rilevato));

        if (containerPrimi) {
            if (eventiPreferiti.length > 0) {
                if (sezionePreferitiTitolo) sezionePreferitiTitolo.style.display = 'block';
                containerPrimi.style.display = 'grid';
                containerPrimi.innerHTML = eventiPreferiti.map(e => creaCardEvento(e, false)).join('');
            } else {
                if (sezionePreferitiTitolo) sezionePreferitiTitolo.style.display = 'none';
                containerPrimi.style.display = 'none';
                containerPrimi.innerHTML = '';
            }
        }

        if (containerEventi) {
            containerEventi.innerHTML = validi.length > 0
                ? validi.map(e => creaCardEvento(e, false)).join('')
                : '<p style="padding: 20px; text-align: center; color: #666;">Nessun evento disponibile con i filtri selezionati.</p>';
        }
    }

    function eseguiFiltroERender() {
        const filtrati = filtraEventiElenco(eventiTotali);
        renderizzaEventi(filtrati);
    }

    document.addEventListener('date-selection-changed', () => {
        eseguiFiltroERender();
    });

    if (eventiTotali && eventiTotali.length > 0) {
        renderizzaEventi(eventiTotali);
    }
    window.festeinvistaDatiPronti = true;
    window.dispatchEvent(new Event('festeinvista-pronta'));

    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-order-select');
    const categoryCheckboxes = document.querySelectorAll('input[name="categoria"]');

    if (searchInput) searchInput.addEventListener('input', () => eseguiFiltroERender());
    if (sortSelect) sortSelect.addEventListener('change', () => eseguiFiltroERender());

    categoryCheckboxes.forEach(chk => {
        chk.addEventListener('change', () => eseguiFiltroERender());
    });

    const idsFiltriDinamici = ['filter-citta', 'filter-provincia', 'filter-regione', 'filter-da', 'filter-a'];
    idsFiltriDinamici.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventoAscolto = el.type === 'date' ? 'change' : 'input';
            el.addEventListener(eventoAscolto, () => eseguiFiltroERender());
        }
    });

    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            const selectMese = document.getElementById('filter-mese');
            if (selectMese) selectMese.value = '';
            document.getElementById('filter-citta').value = '';
            document.getElementById('filter-provincia').value = '';
            document.getElementById('filter-regione').value = '';
            document.getElementById('filter-da').value = '';
            document.getElementById('filter-a').value = '';

            selectedStartDate = null;
            selectedEndDate = null;
            const summaryEl = document.getElementById('date-summary-text');
            if (summaryEl) summaryEl.textContent = '📅 Date';

            categoryCheckboxes.forEach(chk => chk.checked = true);
            initCustomCalendar();
            renderizzaEventi(eventiTotali);
        });
    }

    document.addEventListener('click', (e) => {
        const btnPreferito = e.target.closest('.btn-preferito-overlay');
        if (btnPreferito) {
            const idEvento = btnPreferito.getAttribute('data-id');
            if (idEvento) {
                let preferiti = JSON.parse(localStorage.getItem('festeinvista_preferiti') || '[]');
                if (preferiti.includes(idEvento)) {
                    preferiti = preferiti.filter(id => id !== idEvento);
                    btnPreferito.classList.remove('preferito-attivo');
                } else {
                    preferiti.push(idEvento);
                    btnPreferito.classList.add('preferito-attivo');
                }
                localStorage.setItem('festeinvista_preferiti', JSON.stringify(preferiti));
                eseguiFiltroERender();
            }
            return;
        }

        const btnDettaglio = e.target.closest('.btn-apri-dettaglio');
        if (btnDettaglio) {
            const eventoB64 = btnDettaglio.getAttribute('data-evento-b64');
            try {
                const eventoJson = decodeURIComponent(atob(eventoB64));
                const evento = JSON.parse(eventoJson);
                apriModaleDettagli(evento);
            } catch (err) {
                console.error("Errore nel parsing dei dati dell'evento:", err);
            }
        }
    });
>>>>>>> 8bbd9702ae28e15a16ac13826b8e677621eafe79
});