const DEFAULT_MESSAGE = 'Η αποστολή απέτυχε. Ελέγξτε τα στοιχεία του παραστατικού και δοκιμάστε ξανά.';

const ERROR_MESSAGES = {
  101: 'Λείπουν υποχρεωτικά στοιχεία από το παραστατικό.',
  102: 'Το ΑΦΜ ή τα στοιχεία αντισυμβαλλόμενου δεν έγιναν αποδεκτά.',
  103: 'Υπάρχει πρόβλημα στα στοιχεία εκδότη.',
  104: 'Υπάρχει πρόβλημα στις γραμμές του παραστατικού.',
  105: 'Υπάρχει πρόβλημα στους χαρακτηρισμούς εσόδων.',
  106: 'Υπάρχει πρόβλημα στον ΦΠΑ ή στα σύνολα του παραστατικού.',
  201: 'Το παραστατικό απορρίφθηκε από την υπηρεσία.',
  500: 'Η υπηρεσία επέστρεψε εσωτερικό σφάλμα.'
};

function normalizeCode(code) {
  if (code === null || code === undefined) return '';
  return String(code).trim();
}

function translateError(code, fallback) {
  const normalizedCode = normalizeCode(code);
  return ERROR_MESSAGES[normalizedCode] || fallback || DEFAULT_MESSAGE;
}

module.exports = { translateError };
