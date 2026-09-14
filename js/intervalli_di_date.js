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