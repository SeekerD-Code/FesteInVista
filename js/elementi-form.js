document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container-intervalli');
    const btnAggiungi = document.getElementById('btn-aggiungi-intervallo');

    // Se gli elementi non esistono nella pagina corrente, interrompi l'esecuzione senza errori
    if (!container || !btnAggiungi) return;

    function aggiornaPulsantiRimozione() {
        const righe = container.querySelectorAll('.intervallo-row');
        righe.forEach((riga) => {
            const btnRimuovi = riga.querySelector('.btn-rimuovi');
            if (righe.length > 1) {
                btnRimuovi.style.display = 'block';
            } else {
                btnRimuovi.style.display = 'none';
            }
        });
    }

    btnAggiungi.addEventListener('click', () => {
        const nuovaRiga = document.createElement('div');
        nuovaRiga.className = 'intervallo-row';
        nuovaRiga.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: center;';

        nuovaRiga.innerHTML = `
            <input type="date" name="Data Inizio[]" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
            <input type="date" name="Data Fine[]" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
            <button type="button" class="btn-rimuovi" style="background: #ff4d4d; color: white; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer;" title="Rimuovi intervallo">✕</button>
        `;

        nuovaRiga.querySelector('.btn-rimuovi').addEventListener('click', () => {
            nuovaRiga.remove();
            aggiornaPulsantiRimozione();
        });

        container.appendChild(nuovaRiga);
        aggiornaPulsantiRimozione();
    });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-rimuovi')) {
            e.target.closest('.intervallo-row').remove();
            aggiornaPulsantiRimozione();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const fileSelector = document.getElementById('file-selector');
    const btnAggiungiFile = document.getElementById('btn-aggiungi-file');
    const containerLista = document.getElementById('container-lista-file');
    const msgNessunFile = document.getElementById('nessun-file-msg');
    const fileRealeForm = document.getElementById('file-reale-form');

    if (!fileSelector || !btnAggiungiFile) return;

    // Oggetto per accumulare i file nel tempo
    let dataTransferAcc = new DataTransfer();

    // Cliccando sul finto bottone, apriamo il selettore di file nativo
    btnAggiungiFile.addEventListener('click', () => {
        fileSelector.click();
    });

    // Quando l'utente seleziona uno o più file
    fileSelector.addEventListener('change', (e) => {
        const filesSelezionati = e.target.files;

        for (let i = 0; i < filesSelezionati.length; i++) {
            dataTransferAcc.items.add(filesSelezionati[i]);
        }

        aggiornaListaFileVisiva();

        // Reset dell'input per permettere di selezionare nuovamente lo stesso file se necessario
        fileSelector.value = '';
    });

    function aggiornaListaFileVisiva() {
        // Pulisci la lista visiva eccetto il messaggio iniziale
        containerLista.innerHTML = '';

        const filesPresenti = dataTransferAcc.files;

        if (filesPresenti.length === 0) {
            containerLista.appendChild(msgNessunFile);
            fileRealeForm.files = dataTransferAcc.files;
            return;
        }

        // Mostra ogni file con un pulsante per eliminarlo
        Array.from(filesPresenti).forEach((file, index) => {
            const riga = document.createElement('div');
            riga.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem;';

            riga.innerHTML = `
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">📄 ${file.name}</span>
                <button type="button" data-index="${index}" class="btn-elimina-file" style="background: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" title="Rimuovi file">Elimina</button>
            `;

            containerLista.appendChild(riga);
        });

        // Assegna l'elenco aggiornato all'input reale che invierà il form
        fileRealeForm.files = dataTransferAcc.files;
    }

    // Gestione eliminazione singolo file tramite il pulsante "Elimina"
    containerLista.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-elimina-file')) {
            const indexDaRimuovere = parseInt(e.target.getAttribute('data-index'));
            const nuovoDataTransfer = new DataTransfer();

            // Ricostruisci la lista escludendo l'indice selezionato
            const files = dataTransferAcc.files;
            for (let i = 0; i < files.length; i++) {
                if (i !== indexDaRimuovere) {
                    nuovoDataTransfer.items.add(files[i]);
                }
            }

            dataTransferAcc = nuovoDataTransfer;
            aggiornaListaFileVisiva();
        }
    });
});