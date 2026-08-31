<<<<<<< HEAD
// Funzione globale esportata per aggiornare il contatore da qualsiasi pagina (tranne calendario)
export function aggiornaContatoreEventi(numero) {
    if (window.location.pathname.includes('calendario.html')) return;
    const counterSpan = document.getElementById('counter-value');
    if (counterSpan) {
        counterSpan.textContent = numero;
    }
=======
// Funzione globale esportata per aggiornare il contatore da qualsiasi pagina (tranne calendario)
export function aggiornaContatoreEventi(numero) {
    if (window.location.pathname.includes('calendario.html')) return;
    const counterSpan = document.getElementById('counter-value');
    if (counterSpan) {
        counterSpan.textContent = numero;
    }
>>>>>>> 8bbd9702ae28e15a16ac13826b8e677621eafe79
}