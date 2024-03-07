export const messages = {
    unsavedChangesAlert: {
        en: 'You have some unsaved changes.',
        it: 'Alcune modifiche non sono state salvate.',
        es: 'Tienes algunos cambios sin guardar.',
    },
    uploading: {
        en: 'Uploading...',
        it: 'Uploading...',
        es: 'Cargando...',
    },
    filter: {
        en: 'Filter',
        it: 'Filtra',
        es: 'Filtrar',
    },
    close: {
        en: 'Close',
        it: 'Chiudi',
        es: 'Cerrar',
    },
    save: {
        en: 'Save',
        it: 'Salva',
        es: 'Guardar',
    },
    search: {
        en: 'Search',
        it: 'Cerca',
        es: 'Buscar',
    },
    cannotCopyToClipboardMessage: {
        en: 'Cannot copy to clipboard, please do it manually: Ctrl+C, Enter',
        it: 'Impossibile copiare negli appunti, copiare manualmente: Ctrl+C, Enter',
        es: 'No se puede copiar al portapapeles, por favor copie manualmente: Ctrl+C, Enter',
    },
    retrieveDataError: {
        en: 'There was an error retrieving the data',
        it: 'Si è verificato un errore nel reuperare i dati',
        es: 'Hubo un error al recuperar los datos',
    },
    lightTheme: {
        en: 'Light theme',
        it: 'Tema chiaro',
        es: 'Tema claro',
    },
    darkTheme: {
        en: 'Dark theme',
        it: 'Tema scuro',
        es: 'Tema oscuro',
    },
    translate: {
        en: 'Translate',
        it: 'Traduci',
        es: 'Traducir',
    },
    generateSummary: {
        en: 'Generate summary',
        it: 'Genera il riassunto',
        es: 'Generar resumen',
    },
    generate: {
        en: 'Generate',
        it: 'Genera',
        es: 'Generar',
    },
    words: {
        en: 'Words',
        it: 'Parole',
        es: 'Palabras',
    },
    useBulletedList: {
        en: 'Use bulletted list',
        it: 'Usa elenco puntato',
        es: 'Usa lista de viñetas',
    },
}

export default class Translator {
    constructor(lng) {
        this.lng = this.setLng(lng)
    }

    setLng(lng) {
        if (lng === 'it' || /it-/.test(lng)) {
            return 'it'
        } else if (lng === 'en' || /en-/.test(lng)) {
            return 'en'
        }

        return lng
    }

    get(key) {
        // check custom translations first
        const b = window.Baton
        if (b.translations && b.translations[key] !== 'undefined') {
            return b.translations[key]
        }

        // if key is not found, return empty string
        if (typeof messages[key] === 'undefined') {
            return ''
        }

        // search localized message
        if (messages[key][this.lng] !== undefined) {
            return messages[key][this.lng]
        }

        // default to english
        return messages[key].en
    }
}
